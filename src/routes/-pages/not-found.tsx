import ThemeParticles from "#/components/theme-particles";
import { TypingAnimation } from "#/components/ui/magic/typing-animation";

export default function NotFound() {
  return (
    <div className={"grid size-full place-content-center"}>
      <ThemeParticles className={"absolute inset-0"} />
      <TypingAnimation className={"m-4 text-center font-mono"}>I think we've misplaced something?</TypingAnimation>
    </div>
  );
}
