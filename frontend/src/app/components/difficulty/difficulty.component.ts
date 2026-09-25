import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { StateService } from '@app/services/state.service';
@Component({selector:'app-difficulty', templateUrl:'./difficulty.component.html',styleUrls:['./difficulty.component.scss'],standalone:false,changeDetection:ChangeDetectionStrategy.OnPush})
export class DifficultyComponent {
 @Input() showProgress=true; @Input() showHalving=false; @Input() showTitle=true;
 mode: 'difficulty' | 'halving'='difficulty';
 data$=this.stateService.blocks$.pipe(map(blocks=>{const b=blocks[0];if(!b)return null;const sorted=[...blocks].reverse();const max=Math.max(...sorted.map(x=>x.difficulty));return {block:b, samples:sorted.map((x,i)=>({height:x.height,x:i*22.4,difficulty:x.difficulty,h:Math.max(1,x.difficulty/max*9)})),interval:blocks.length>1?(b.timestamp-blocks[blocks.length-1].timestamp)/(blocks.length-1):null};}));
 constructor(public stateService:StateService){}
 setMode(mode:'difficulty'|'halving'){this.mode=mode;return false;}
}
