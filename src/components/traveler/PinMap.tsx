import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type {
  LatLngTuple,
  LayerGroup,
  Map as LeafletMap,
  Marker,
} from "leaflet";
import {
  BedDouble,
  Bus,
  Landmark,
  MapPin,
  Plane,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { Pin, PinKind } from "../../lib/mapPins";
import { loadLeaflet, type Leaflet } from "../../lib/leaflet";
import "../../styles/map.css";

export interface PinMapProps {
  pins: Pin[];
  /** Draw a dashed line through the pins in order (the route map). */
  route?: boolean;
  /** Show each pin's label beside it. */
  labels?: boolean;
  /** Pan/zoom by touch and wheel. Off for the small in-page cards. */
  interactive?: boolean;
  /** Id of the highlighted pin. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Height (px) covered by an overlay along the bottom, kept clear of pins. */
  bottomInset?: number;
  /** Rendered in place of the map when the library fails to load. */
  fallback?: ReactNode;
  /**
   * Whether this map is on screen. The day pager keeps neighbouring days
   * mounted, so an inactive map holds off building Leaflet (and fetching
   * tiles) until its day is actually shown.
   */
  active?: boolean;
  ariaLabel: string;
}

/** OpenStreetMap's standard raster tiles — free, ODbL, attribution required. */
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
const LEAFLET_PREFIX =
  '<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>';
const MAX_ZOOM = 18;
/** Keeps the outermost pins (and their labels) clear of the edges. */
const FIT_PADDING = 44;
/** Fraction of the view treated as "edge" — a selected pin there is panned in. */
const EDGE_MARGIN = 0.15;
/** Neighbourhood scale when there is a single pin to show. */
const SINGLE_PIN_ZOOM = 14;
const PIN_SIZE = 34;
const LABEL_OFFSET: [number, number] = [0, -16];
const ROUTE_STYLE = {
  className: "yl-route",
  weight: 3,
  opacity: 0.75,
  dashArray: "6 9",
};

const ICONS: Record<Exclude<PinKind, "city">, LucideIcon> = {
  stay: BedDouble,
  airport: Plane,
  meal: Utensils,
  attraction: Landmark,
  transport: Bus,
  other: MapPin,
};

const KINDS = new Set<PinKind>([
  "city",
  "stay",
  "attraction",
  "meal",
  "transport",
  "other",
  "airport",
]);

/**
 * An item's `kind` is stored trip data that `normalizeTrip` coerces, but this
 * is the last line before it reaches markup and an icon table, so narrow it
 * once more rather than trust it.
 */
const safeKind = (kind: PinKind): PinKind => (KINDS.has(kind) ? kind : "other");

/** What sits inside a pin: the route number, or the category's icon. */
function PinGlyph({ pin }: { pin: Pin }) {
  const kind = safeKind(pin.kind);
  if (kind === "city") return <>{pin.order}</>;
  const Icon = ICONS[kind] ?? MapPin;
  return <Icon size={15} strokeWidth={2.5} color="#fff" aria-hidden />;
}

/** A marker's inner disc, which React renders the glyph into. */
interface Slot {
  id: string;
  el: HTMLElement;
}

/**
 * The Leaflet map itself: tiles, pins and optionally the route between them.
 * Imperative by nature, so it lives behind refs and syncs from props in
 * effects — the library loads lazily and the map is built once per mount. Pin
 * glyphs are React portals into the marker elements, so icons come from the
 * same lucide set as the cards rather than hand-copied SVG.
 */
export function PinMap({
  pins,
  route = false,
  labels = false,
  interactive = true,
  selectedId = null,
  onSelect,
  bottomInset = 0,
  fallback = null,
  active = true,
  ariaLabel,
}: PinMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const routeKeyRef = useRef("");
  const onSelectRef = useRef(onSelect);
  const [L, setL] = useState<Leaflet | null>(null);
  const [failed, setFailed] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Load the library once; the map waits for it. The chunk can fail to arrive
  // (offline before the first visit, stale index after a deploy) — say so
  // rather than leaving a blank panel.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((lib) => {
        if (!cancelled) setL(lib);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Build the map once the library is here and the map is on screen; tear it
  // down on unmount (or when its day scrolls off, so a swipe never keeps four
  // live maps and their tile fetches going).
  useEffect(() => {
    const el = containerRef.current;
    if (!L || !el || !active) return;
    const map = L.map(el, {
      zoomControl: false,
      worldCopyJump: true,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });
    map.attributionControl.setPrefix(LEAFLET_PREFIX);
    L.tileLayer(OSM_TILES, {
      maxZoom: MAX_ZOOM,
      attribution: OSM_ATTRIBUTION,
      // OSM serves tiles with `Access-Control-Allow-Origin: *`; asking for CORS
      // lets the service worker cache them as real responses (vite.config.ts).
      crossOrigin: true,
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    // The phone frame can resize (font scale, orientation); Leaflet needs to be
    // told, or tiles render against a stale size.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current = new Map();
      routeKeyRef.current = "";
      setSlots([]);
    };
  }, [L, interactive, active]);

  // Redraw pins (and the route) whenever they change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    // Set the view before adding anything: Leaflet only materialises a
    // marker's element once the map has a view, and the glyph slots below are
    // read straight after each marker is added.
    //
    // The trip is a live subscription, so `pins` gets a new identity on any
    // remote edit. Only re-fit when the pins themselves moved; a traveler
    // zoomed into one spot should not be snapped back by an admin fixing a
    // typo elsewhere.
    const points: LatLngTuple[] = pins.map((p) => [p.lat, p.lng]);
    const routeKey = points.map((p) => p.join(",")).join("|");
    if (routeKey !== routeKeyRef.current) {
      routeKeyRef.current = routeKey;
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), {
          paddingTopLeft: [FIT_PADDING, FIT_PADDING],
          paddingBottomRight: [FIT_PADDING, FIT_PADDING + bottomInset],
        });
      } else if (points.length === 1) {
        map.setView(points[0], SINGLE_PIN_ZOOM);
      }
    }

    const markers = new Map<string, Marker>();
    const nextSlots: Slot[] = [];
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          className: "yl-pin-wrap",
          // Narrowed to our own literals, so nothing from the trip reaches
          // this markup.
          html: `<div class="yl-pin yl-pin--${safeKind(pin.kind)}"></div>`,
          iconSize: [PIN_SIZE, PIN_SIZE],
          iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
        }),
        title: pin.label,
        keyboard: interactive,
      })
        .on("click", () => onSelectRef.current?.(pin.id))
        .addTo(layer);
      if (labels) {
        // Tooltip content is set as an element, so the label (trip data) is
        // never parsed as HTML.
        const text = document.createElement("span");
        text.textContent = pin.label;
        marker.bindTooltip(text, {
          permanent: true,
          direction: "top",
          offset: LABEL_OFFSET,
          className: "yl-tip",
          interactive: false,
        });
      }
      markers.set(pin.id, marker);
      const disc = marker.getElement()?.firstElementChild;
      if (disc instanceof HTMLElement) nextSlots.push({ id: pin.id, el: disc });
    }
    markersRef.current = markers;
    setSlots(nextSlots);

    if (route && points.length > 1) {
      L.polyline(points, ROUTE_STYLE).addTo(layer);
    }
  }, [L, pins, route, labels, interactive, bottomInset, active]);

  // Highlight the selected pin and bring it into view.
  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map) return;
    for (const [id, marker] of markersRef.current) {
      const on = id === selectedId;
      marker
        .getElement()
        ?.firstElementChild?.classList.toggle("yl-pin--on", on);
      marker.setZIndexOffset(on ? 1000 : 0);
    }
    const pin = pins.find((p) => p.id === selectedId);
    if (!pin) return;
    // Pan only when the pin is out of view (or hugging the edge): after
    // `fitBounds` everything is on screen, and re-centring on the first pin
    // would shove the others off the map.
    const point = L.latLng(pin.lat, pin.lng);
    if (!map.getBounds().pad(-EDGE_MARGIN).contains(point)) map.panTo(point);
  }, [L, pins, selectedId, slots]);

  if (failed) return <>{fallback}</>;

  return (
    <>
      <div
        ref={containerRef}
        className="yl-map"
        role="application"
        aria-label={ariaLabel}
      />
      {slots.map(({ id, el }) => {
        const pin = pins.find((p) => p.id === id);
        return pin ? createPortal(<PinGlyph pin={pin} />, el, id) : null;
      })}
    </>
  );
}
