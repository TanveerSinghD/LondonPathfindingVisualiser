import { AlgorithmGenerator, AlgorithmStep, AlgorithmResult } from "../algorithms/types";
import { SPEED_MAP, SpeedSetting, VisualizationStep, normalizeStep } from "./types";

type StepHandler = (step: VisualizationStep) => void;
type CompleteHandler = (result: IteratorResult<AlgorithmStep, AlgorithmResult>) => void;

export class Visualizer {
  private timer: number | null = null;
  private speed: SpeedSetting = "normal";
  private stepCount = 0;

  setSpeed(speed: SpeedSetting) {
    this.speed = speed;
  }

  stop() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  run(generator: AlgorithmGenerator, onStep: StepHandler, onComplete: CompleteHandler) {
    this.stop();
    this.stepCount = 0;

    const iterate = () => {
      const next = generator.next();

      if (!next.done && next.value) {
        this.stepCount += 1;
        console.debug("[viz] step", this.stepCount);
        onStep(normalizeStep(next.value));
        this.timer = window.setTimeout(iterate, SPEED_MAP[this.speed]);
        return;
      }

      onComplete(next);
    };

    iterate();
  }
}
