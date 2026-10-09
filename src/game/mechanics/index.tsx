/** Mechanic registry: renders the component that plays a level's mechanic kind. */
import type { MechanicConfig } from '../types';
import { ArrowMechanic } from './ArrowMechanic';
import { ButtonMechanic } from './ButtonMechanic';
import { ChaseMechanic } from './ChaseMechanic';
import { ChoiceMechanic } from './ChoiceMechanic';
import { CountMechanic } from './CountMechanic';
import { DragMechanic } from './DragMechanic';
import { HoldMechanic } from './HoldMechanic';
import { ScreenMechanic } from './ScreenMechanic';
import { ShakeMechanic } from './ShakeMechanic';
import { SwipeMechanic } from './SwipeMechanic';
import { SwitchMechanic } from './SwitchMechanic';
import { TimingMechanic } from './TimingMechanic';
import type { MechanicProps } from './types';

export function MechanicView({ config, ...rest }: MechanicProps<MechanicConfig>) {
  switch (config.kind) {
    case 'button':
      return <ButtonMechanic config={config} {...rest} />;
    case 'screen':
      return <ScreenMechanic config={config} {...rest} />;
    case 'swipe':
      return <SwipeMechanic config={config} {...rest} />;
    case 'hold':
      return <HoldMechanic config={config} {...rest} />;
    case 'choice':
      return <ChoiceMechanic config={config} {...rest} />;
    case 'chase':
      return <ChaseMechanic config={config} {...rest} />;
    case 'timing':
      return <TimingMechanic config={config} {...rest} />;
    case 'arrow':
      return <ArrowMechanic config={config} {...rest} />;
    case 'switch':
      return <SwitchMechanic config={config} {...rest} />;
    case 'shake':
      return <ShakeMechanic config={config} {...rest} />;
    case 'drag':
      return <DragMechanic config={config} {...rest} />;
    case 'count':
      return <CountMechanic config={config} {...rest} />;
    default:
      return null;
  }
}
