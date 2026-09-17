import { describe, expect, it } from "vitest";
import { C, DEFAULT_TIME, handAngles, polar } from "./geometry";

describe("repère du cadran", () => {
  it("0° pointe vers midi", () => {
    const p = polar(100, 0);
    expect(p.x).toBeCloseTo(C, 5);
    expect(p.y).toBeCloseTo(C - 100, 5);
  });

  it("90° pointe vers 3 heures", () => {
    const p = polar(100, 90);
    expect(p.x).toBeCloseTo(C + 100, 5);
    expect(p.y).toBeCloseTo(C, 5);
  });
});

describe("angles des aiguilles", () => {
  it("place les aiguilles sur 10 h 10, la position des photographies horlogères", () => {
    const { hour, minute } = handAngles({ hours: 10, minutes: 10, seconds: 0 });
    expect(hour).toBeCloseTo(305, 5);
    expect(minute).toBeCloseTo(60, 5);
  });

  it("l'aiguille GMT fait un tour en vingt-quatre heures", () => {
    expect(handAngles({ hours: 0, minutes: 0, seconds: 0 }).gmt).toBe(0);
    expect(handAngles({ hours: 12, minutes: 0, seconds: 0 }).gmt).toBe(180);
    expect(handAngles({ hours: 18, minutes: 0, seconds: 0 }).gmt).toBe(270);
  });

  it("l'heure par défaut du rendu est bien 10 h 10", () => {
    expect(DEFAULT_TIME.hours).toBe(10);
    expect(DEFAULT_TIME.minutes).toBe(10);
  });
});
