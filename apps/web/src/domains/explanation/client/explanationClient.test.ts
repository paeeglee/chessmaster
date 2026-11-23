import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../shared/lib/testing/server";
import {
  askQuestion,
  ExplanationError,
  type GameContract,
  type GameExplanation,
  requestExplanation,
} from "./explanationClient";

const contract = { level: "beginner" } as unknown as GameContract;
const explanation: GameExplanation = {
  verdict: "Vitória.",
  patterns_sentence: "Nenhum padrão.",
  key_moments: [],
  strengths: [],
  next_game_habit: "Confira as peças atacadas.",
};

describe("explanationClient", () => {
  it("envia o contrato e devolve a explicação", async () => {
    let received: unknown = null;
    server.use(
      http.post("/api/explanations", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(explanation);
      }),
    );
    await expect(requestExplanation(contract)).resolves.toEqual(explanation);
    expect(received).toEqual(contract);
  });

  it("transforma respostas de erro em ExplanationError com o detail", async () => {
    server.use(
      http.post("/api/explanations", () =>
        HttpResponse.json({ detail: "ai_unavailable" }, { status: 503 }),
      ),
    );
    const error = await requestExplanation(contract).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ExplanationError);
    expect(error).toMatchObject({ status: 503, detail: "ai_unavailable" });
  });

  it("usa 'unknown' quando o erro não tem detail", async () => {
    server.use(http.post("/api/questions", () => new HttpResponse("boom", { status: 500 })));
    await expect(askQuestion({ game: contract, question: "Oi?" })).rejects.toMatchObject({
      status: 500,
      detail: "unknown",
    });
  });

  it("pergunta à IA", async () => {
    server.use(
      http.post("/api/questions", () => HttpResponse.json({ answer: "Sim.", in_scope: true })),
    );
    await expect(askQuestion({ game: contract, question: "Oi?" })).resolves.toEqual({
      answer: "Sim.",
      in_scope: true,
    });
  });
});
