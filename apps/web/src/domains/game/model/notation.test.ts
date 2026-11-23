import { describe, expect, it } from "vitest";
import { detectNotation, portugueseToEnglishSan, toPortugueseSan } from "./notation";

describe("toPortugueseSan", () => {
  it.each([
    ["Nf3", "Cf3"],
    ["Qxd8", "Dxd8"],
    ["Rxa1", "Txa1"],
    ["Kf2", "Rf2"],
    ["Bxa1", "Bxa1"],
    ["e8=Q+", "e8=D+"],
    ["O-O", "O-O"],
    ["Rxe4+", "Txe4+"],
    ["R1a3", "T1a3"],
    ["dxe5", "dxe5"],
  ])("%s → %s", (english, portuguese) => {
    expect(toPortugueseSan(english)).toBe(portuguese);
  });
});

describe("portugueseToEnglishSan", () => {
  it.each([
    ["Cf3", "Nf3"],
    ["Dxd8", "Qxd8"],
    ["Txa1", "Rxa1"],
    ["Rf2", "Kf2"],
    ["Bxa1", "Bxa1"],
    ["e8=D", "e8=Q"],
    ["e8D", "e8Q"],
    ["O-O-O", "O-O-O"],
    ["T1a3", "R1a3"],
  ])("%s → %s", (portuguese, english) => {
    expect(portugueseToEnglishSan(portuguese)).toBe(english);
  });
});

describe("detectNotation", () => {
  it("é inglesa quando aparece N, Q ou K", () => {
    expect(detectNotation(["d4", "Nf3"])).toBe("en");
    expect(detectNotation(["Qh5"])).toBe("en");
    expect(detectNotation(["Kf2"])).toBe("en");
    expect(detectNotation(["e8=Q"])).toBe("en");
  });

  it("é portuguesa quando aparece C, D ou T", () => {
    expect(detectNotation(["d4", "Cc3"])).toBe("pt");
    expect(detectNotation(["Dxd8"])).toBe("pt");
    expect(detectNotation(["Te8"])).toBe("pt");
    expect(detectNotation(["e8=D"])).toBe("pt");
  });

  it("fica indeterminada só com R, B e lances de peão", () => {
    expect(detectNotation(["e4", "Bc4", "Re1"])).toBe("undetermined");
    expect(detectNotation(["e4", "e5"])).toBe("undetermined");
  });

  it("não lê o O do roque como letra de peça", () => {
    expect(detectNotation(["e4", "O-O", "O-O-O"])).toBe("undetermined");
  });
});
