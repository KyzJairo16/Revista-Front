import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevistaComponent } from './revista/revista';
import { LoginComponent } from './login/login';
import { PerfilEditorComponent } from './perfil-editor/perfil-editor';
import { AdminComponent } from './admin/admin';

const routes: Routes = [
  // Pantalla Inicial: Formulario Crema con la periodista
  { path: '', component: RevistaComponent },

  // Pantalla de Registro: Formulario Morado para crear cuenta
  { path: 'login', component: LoginComponent },

  // Panel de Trabajo: Parrilla de contenidos del Editor
  { path: 'perfil-editor', component: PerfilEditorComponent },
  { path: 'admin', component: AdminComponent },

  // Comodín de seguridad: Si escriben cualquier cosa extraña, volvemos al inicio limpio
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
