import * as THREE from "three";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

export type GeoFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export async function loadLandGeometry(radius: number): Promise<{
  outlinePoints: [number, number, number][][];
  fillGeometries: THREE.BufferGeometry[];
}> {
  const response = await fetch("/land-110m.json");
  const topology = (await response.json()) as Topology;
  const landObj = topology.objects.land as GeometryCollection;
  const geojson = feature(topology, landObj) as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

  const outlinePoints: [number, number, number][][] = [];
  const fillGeometries: THREE.BufferGeometry[] = [];

  for (const feat of geojson.features) {
    const polygons: GeoJSON.Position[][][] =
      feat.geometry.type === "MultiPolygon"
        ? feat.geometry.coordinates
        : [feat.geometry.coordinates];

    for (const polygon of polygons) {
      const outerRing = polygon[0];
      if (!outerRing || outerRing.length < 4) continue;

      const ringPoints: [number, number, number][] = outerRing.map(([lng, lat]) => {
        const v = latLngToVec3(lat, lng, radius + 0.004);
        return [v.x, v.y, v.z] as [number, number, number];
      });
      outlinePoints.push(ringPoints);

      const vecs = outerRing.map(([lng, lat]) => latLngToVec3(lat, lng, radius + 0.002));
      const center = new THREE.Vector3();
      vecs.forEach((v) => center.add(v));
      center.divideScalar(vecs.length);
      center.normalize().multiplyScalar(radius + 0.002);

      const vertices: number[] = [];
      for (let i = 0; i < vecs.length - 1; i++) {
        vertices.push(center.x, center.y, center.z);
        vertices.push(vecs[i].x, vecs[i].y, vecs[i].z);
        vertices.push(vecs[i + 1].x, vecs[i + 1].y, vecs[i + 1].z);
      }

      if (vertices.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        geo.computeVertexNormals();
        fillGeometries.push(geo);
      }
    }
  }

  return { outlinePoints, fillGeometries };
}
