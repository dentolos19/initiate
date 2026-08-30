import ThemeParticles from "#/components/theme-particles";
import { TypingAnimation } from "#/components/ui/magic/typing-animation";

export default function NotAllowed() {
  return (
    <div className={"grid size-full place-content-center"}>
      <ThemeParticles className={"absolute inset-0"} />
      <TypingAnimation className={"m-4 text-center font-mono"}>You shall not pass!</TypingAnimation>
    </div>
  );
}
