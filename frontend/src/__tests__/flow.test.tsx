import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import CharacterPanel from "../components/character-panel";
import DialogueModal from "../components/dialogue-modal";
import { getCharacters, addCharacter, getDialogues, updateDialogue } from "@/api";

vi.mock("@/api", () => ({
  getCharacters: vi.fn().mockResolvedValue([]),
  addCharacter: vi.fn().mockResolvedValue({ id: "c1", name: "John" }),
  getDialogues: vi.fn().mockResolvedValue([{ id: "d1", text: "Hi" }]),
  updateDialogue: vi.fn().mockResolvedValue({}),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe("Character and dialogue flow", () => {
  it("adds a character from the panel", async () => {
    (window as any).prompt = vi.fn().mockReturnValue("John");
    renderWithClient(
      <CharacterPanel screenplayId="s1" onViewDialogues={() => {}} />
    );
    fireEvent.click(screen.getByText("إضافة شخصية"));
    await waitFor(() => {
      expect(addCharacter).toHaveBeenCalledWith("s1", { name: "John" });
    });
  });

  it("edits a dialogue in the modal", async () => {
    renderWithClient(
      <DialogueModal
        open={true}
        onOpenChange={() => {}}
        characterId="c1"
        characterName="Char"
      />
    );
    const editable = await screen.findByText("Hi");
    fireEvent.blur(editable, { target: { innerText: "Hello" } });
    await waitFor(() => {
      expect(updateDialogue).toHaveBeenCalledWith("d1", "Hello");
    });
  });
});

