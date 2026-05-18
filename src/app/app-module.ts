import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { App } from './app';
import { RevistaComponent } from './revista/revista';
import { LoginComponent } from './login/login';
import { AppRoutingModule } from './app-routing-module';
import { PerfilEditorComponent } from './perfil-editor/perfil-editor';
import { AdminComponent } from './admin/admin';
import { LectorComponent } from './lector/lector';


@NgModule({
  declarations: [
    App,
    RevistaComponent,
    LoginComponent,
    PerfilEditorComponent,
    AdminComponent,
    LectorComponent,
  ],
  imports: [BrowserModule, CommonModule, RouterModule, AppRoutingModule, FormsModule],
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
