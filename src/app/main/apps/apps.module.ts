import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';

import { ApiService } from 'app/modulos/api.service';

// routing
const routes: Routes = [
  {
    path: 'e-commerce',
    loadChildren: () => import('./ecommerce/ecommerce.module').then(m => m.EcommerceModule)
  },
];

FullCalendarModule.registerPlugins([dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]);

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  providers: [
    ApiService,
  ]
})
export class AppsModule {}
