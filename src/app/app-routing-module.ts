import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevistaComponent } from './revista/revista';
import { LoginComponent } from './login/login';
import { PerfilEditorComponent } from './perfil-editor/perfil-editor';
import { AdminComponent } from './admin/admin';
import { LectorComponent } from './lector/lector';

const routes: Routes = [
  { path: '', component: RevistaComponent },
  { path: 'login', component: LoginComponent },
  { path: 'perfil-editor', component: PerfilEditorComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'lector', component: LectorComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
