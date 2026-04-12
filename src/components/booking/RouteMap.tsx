"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Antalya Airport coordinates
const AIRPORT: [number, number] = [36.8987, 30.7933];

interface RouteMapProps {
  destinationLat?: number;
  destinationLng?: number;
  destinationName?: string;
  className?: string;
}

export default function RouteMap({
  destinationLat,
  destinationLng,
  destinationName,
  className = "",
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ km: number; min: number } | null>(null);

  // Custom orange marker icon
  const airportIcon = L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;background:#007AFF;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.2-2.9 2.9-2.1-.4c-.3-.1-.7 0-.9.2l-.5.5 3.3 1.9 1.9 3.3.5-.5c.3-.3.3-.6.2-.9l-.4-2.1 2.9-2.9 3.2 5.5c.2.4.8.5 1.1.3l.5-.3c.4-.2.6-.7.5-1.1z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const destIcon = L.divIcon({
    className: "",
    html: `<div style="width:32px;height:40px;position:relative">
      <div style="width:32px;height:32px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
        <svg style="transform:rotate(45deg)" width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      </div>
    </div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      }).setView(AIRPORT, 10);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        detectRetina: true,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const routeLayer = L.layerGroup().addTo(map);
      routeLayerRef.current = routeLayer;
      mapInstanceRef.current = map;

      // Force tile reload after mount
      setTimeout(() => map.invalidateSize(), 200);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update route when destination changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();
    setRouteInfo(null);

    if (!destinationLat || !destinationLng) {
      map.setView(AIRPORT, 10);
      // Add airport marker alone
      L.marker(AIRPORT, { icon: airportIcon })
        .bindTooltip("Antalya Airport", { permanent: true, direction: "top", offset: [0, -16], className: "map-label" })
        .addTo(routeLayer);
      return;
    }

    const dest: [number, number] = [destinationLat, destinationLng];

    // Add markers with permanent labels
    L.marker(AIRPORT, { icon: airportIcon })
      .bindTooltip("Antalya Airport", { permanent: true, direction: "top", offset: [0, -16], className: "map-label" })
      .addTo(routeLayer);

    L.marker(dest, { icon: destIcon })
      .bindTooltip(destinationName ?? "Destination", { permanent: true, direction: "top", offset: [0, -40], className: "map-label" })
      .addTo(routeLayer);

    // Fetch route from OpenRouteService (free, 2000 req/day)
    fetchRoute(AIRPORT, dest, routeLayer, map);
  }, [destinationLat, destinationLng, destinationName]);

  async function fetchRoute(
    from: [number, number],
    to: [number, number],
    layer: L.LayerGroup,
    map: L.Map
  ) {
    try {
      // ORS uses [lng, lat] format
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );

        // Route line with glow effect
        L.polyline(coords, {
          color: "#007AFF",
          weight: 5,
          opacity: 0.8,
          lineJoin: "round",
        }).addTo(layer);

        // Glow underneath
        L.polyline(coords, {
          color: "#007AFF",
          weight: 12,
          opacity: 0.15,
          lineJoin: "round",
        }).addTo(layer);

        // Set route info
        setRouteInfo({
          km: Math.round(route.distance / 1000),
          min: Math.round(route.duration / 60),
        });

        // Fit map to show both markers + route
        const bounds = L.latLngBounds([from, to]);
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
          }
        }, 400);
      } else {
        // Fallback: straight line
        drawStraightLine(from, to, layer, map);
      }
    } catch {
      // Fallback: straight line if API fails
      drawStraightLine(from, to, layer, map);
    }
  }

  function drawStraightLine(
    from: [number, number],
    to: [number, number],
    layer: L.LayerGroup,
    map: L.Map
  ) {
    L.polyline([from, to], {
      color: "#007AFF",
      weight: 3,
      opacity: 0.6,
      dashArray: "10 6",
    }).addTo(layer);

    const bounds = L.latLngBounds([from, to]);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }, 400);
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 220, background: "#f0f4f8" }} />

      {/* Route info badge */}
      {routeInfo && (
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-2 z-[1000]" style={{ background: "rgba(0,122,255,0.9)", backdropFilter: "blur(8px)" }}>
          <span>{routeInfo.km} km</span>
          <span className="w-1 h-1 rounded-full bg-white" />
          <span>~{routeInfo.min} min</span>
        </div>
      )}

      {/* Powered by badge */}
      <div className="absolute bottom-1 left-1 px-2 py-0.5 text-[10px] text-gray-900/30 z-[1000]">
        OpenStreetMap
      </div>
    </div>
  );
}
