import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ModelsListComponent } from './models-list/models-list.component';
import { ModelCardComponent } from './model-card/model-card.component';
import { ModelEditorComponent } from './model-editor/model-editor.component';
import { ModelViewerComponent } from './model-viewer/model-viewer.component';

import { FieldDimensionsService } from '../services/field-dimensions.service';

@NgModule({
  declarations: [
    ModelsListComponent,
    ModelCardComponent,
    ModelViewerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DragDropModule,
    ModelEditorComponent  // ✅ Import en tant que standalone
  ],
  exports: [
    ModelsListComponent
  ],
  providers: [
    FieldDimensionsService  // ✅ Service disponible globalement
  ]
})
export class ModelsModule { }