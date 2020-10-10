import { trigger, animate, transition, style, state, group } from '@angular/animations';

export const slideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({transform: 'translateY(-100%)'}),
    animate('200ms ease-in', style({transform: 'translateY(0%)'}))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({transform: 'translateY(-100%)'}))
  ])
]);

export const slideInOutWithFade = trigger('slideInOutWithFade', [
  state('in', style({height: '*', opacity: 0})),
  transition(':leave', [
    style({height: '*', opacity: 1}),
    group([
      animate(250, style({height: 0})),
      animate('200ms ease-in-out', style({'opacity': '0'}))
    ])
  ]),
  transition(':enter', [
    style({height: '0', opacity: 0}),
    group([
      animate(250, style({height: '*'})),
      animate('300ms ease-in-out', style({'opacity': '1'}))
    ])
  ])
]);
