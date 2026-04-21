import { describe, it, expect } from 'vitest';
import { drawCard, drawFive, computeRarityPool, isDestinedHit } from '../src/draw.js';

const mockCards = [
  { id: 'R001', rarity: 'R', type: 'roast', role: 'leader', name: 'R1' },
  { id: 'R002', rarity: 'R', type: 'roast', role: 'leader', name: 'R2' },
  { id: 'SR001', rarity: 'SR', type: 'angel', role: 'leader', name: 'SR1' },
  { id: 'SSR002', rarity: 'SSR', type: 'angel', role: 'leader', name: 'SSR2' },
  { id: 'SSR001', rarity: 'SSR', type: 'angel', role: 'leader', name: 'Santa',
    destined_tags: ['fire_sign','lucky','loved','foodie','good_day'],
    destined_roll: 0.05 }
];

describe('computeRarityPool', () => {
  it('returns base pool when luck is neutral', () => {
    expect(computeRarityPool(0)).toEqual({ R: 0.75, SR: 0.20, SSR: 0.05 });
  });
  it('boosts SSR when luck >= 6', () => {
    expect(computeRarityPool(6)).toEqual({ R: 0.60, SR: 0.30, SSR: 0.10 });
  });
  it('suppresses SSR when luck <= -4', () => {
    expect(computeRarityPool(-4)).toEqual({ R: 0.85, SR: 0.13, SSR: 0.02 });
  });
});

describe('isDestinedHit', () => {
  const santa = mockCards.find(c => c.id === 'SSR001');
  const fullTags = new Set(['fire_sign','lucky','loved','foodie','good_day']);
  const partialTags = new Set(['fire_sign','lucky']);

  it('returns true when all destined_tags matched AND roll succeeds', () => {
    expect(isDestinedHit(santa, fullTags, () => 0.01)).toBe(true);
  });
  it('returns false when a destined_tag is missing', () => {
    expect(isDestinedHit(santa, partialTags, () => 0.01)).toBe(false);
  });
  it('returns false when roll exceeds destined_roll threshold', () => {
    expect(isDestinedHit(santa, fullTags, () => 0.99)).toBe(false);
  });
  it('returns false when card has no destined_tags', () => {
    const sr1 = mockCards.find(c => c.id === 'SR001');
    expect(isDestinedHit(sr1, fullTags, () => 0.01)).toBe(false);
  });
});

describe('drawCard', () => {
  it('returns the destined card when path + luck roll hit', () => {
    const tags = new Set(['fire_sign','lucky','loved','foodie','good_day']);
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 8,
      random: () => 0.01
    });
    expect(card.id).toBe('SSR001');
  });

  it('returns an R rarity card when random falls in R slice', () => {
    const tags = new Set();
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 0,
      random: () => 0.10
    });
    expect(card.rarity).toBe('R');
  });

  it('returns an SR rarity card when random falls in SR slice', () => {
    const tags = new Set();
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 0,
      random: () => 0.80
    });
    expect(card.rarity).toBe('SR');
  });

  it('returns an SSR that is NOT the destined card when path missing', () => {
    const tags = new Set(['fire_sign']);
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 0,
      random: () => 0.97
    });
    expect(card.rarity).toBe('SSR');
    expect(card.id).not.toBe('SSR001');
  });
});

describe('drawFive', () => {
  it('returns exactly 5 cards', () => {
    const result = drawFive({
      cards: mockCards,
      tags: new Set(),
      luckScore: 0,
      random: () => 0.5
    });
    expect(result).toHaveLength(5);
  });

  it('guarantees at least one non-R when all 5 would be R', () => {
    // random always returns 0.10 → always picks R rarity slice
    const result = drawFive({
      cards: mockCards,
      tags: new Set(),
      luckScore: 0,
      random: () => 0.10
    });
    const nonR = result.filter(c => c.rarity !== 'R');
    expect(nonR.length).toBeGreaterThanOrEqual(1);
  });

  it('does not force replace when at least one non-R already present', () => {
    // Alternate 0.10 (R) and 0.80 (SR) so some come back as SR naturally
    let i = 0;
    const seq = [0.10, 0.10, 0.80, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10];
    const random = () => seq[i++ % seq.length];
    const result = drawFive({
      cards: mockCards,
      tags: new Set(),
      luckScore: 0,
      random
    });
    const rarities = result.map(c => c.rarity);
    const hasNonR = rarities.some(r => r !== 'R');
    expect(hasNonR).toBe(true);
  });
});
