import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HelpTip } from 'src/app/models/help-tip.model';
import { NzCarouselComponent } from 'ng-zorro-antd';

@Component({
  selector: 'fm-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit, AfterViewInit {

  @ViewChild('carousel') carousel: NzCarouselComponent;
  tips: HelpTip[] = [
    {
      image: './assets/images/help/right_click_context_menu.png',
      description: 'RightClickHelpTip'
    },
    {
      image: './assets/images/help/json_editor_menu.png',
      description: 'JsonEditorHelpTip'
    },
    {
      image: './assets/images/help/settings.png',
      description: 'SettingsHelpTip'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    console.log(this.carousel);
    setTimeout(() => { this.carousel.carouselContents.setDirty(); }, 200);
  }

}
