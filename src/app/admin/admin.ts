import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AutentificacionService } from '../services/autentificacion';

interface UsuarioSistema {
  id?: number;
  usuario: string;
  contrasena?: string;
  rol: 'ADMINISTRADOR' | 'EDITOR' | 'SUSCRIPTOR';
}

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  public autentificacionService = inject(AutentificacionService);
  private router = inject(Router);
  private http = inject(HttpClient);

  nombreUsuarioLogueado: string = 'Administrador';
  listaUsuarios: UsuarioSistema[] = [];
  usuariosFiltrados: UsuarioSistema[] = [];

  // Filtros de búsqueda
  busquedaTexto: string = '';
  filtroRol: string = 'TODO';

  // Control de Modales
  modalFormularioAbierto: boolean = false;
  modoEdicion: boolean = false;
  usuarioParaEliminar: UsuarioSistema | null = null;
  usuarioEnEdicionOriginal: UsuarioSistema | null = null;

  // Campos del Formulario (Sin correo electrónico)
  idUsuarioForm: number | undefined = undefined;
  usuarioForm: string = '';
  contrasenaForm: string = '';
  rolForm: 'ADMINISTRADOR' | 'EDITOR' | 'SUSCRIPTOR' = 'SUSCRIPTOR';

  ngOnInit(): void {
    const rolCrudo = this.autentificacionService.getRol();
    const rolGuardado = rolCrudo ? rolCrudo.toUpperCase().trim() : '';

    // Validación unificada del rol de acceso operativo
    if (rolGuardado !== 'ADMINISTRADOR') {
      console.warn('⚠️ Acceso Denegado. Redirigiendo al inicio por falta de permisos de Administrador.');
      this.router.navigate(['/']);
      return;
    }

    this.nombreUsuarioLogueado = this.autentificacionService.getUsuario() || 'Admin Central';
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.http.get<UsuarioSistema[]>('http://localhost:8080/api/usuarios/listar', this.autentificacionService.getHeaders()).subscribe({
      next: (data) => {
        this.listaUsuarios = data || [];
        this.filtrarUsuarios();
      },
      error: (err) => {
        console.error('Error al descargar usuarios de Spring Boot:', err);
        this.listaUsuarios = [];
        this.usuariosFiltrados = [];
      }
    });
  }

  filtrarUsuarios(): void {
    const texto = this.busquedaTexto.toLowerCase().trim();
    this.usuariosFiltrados = this.listaUsuarios.filter(u => {
      const cumpleTexto = u.usuario.toLowerCase().includes(texto);
      const cumpleRol = this.filtroRol === 'TODO' || u.rol === this.filtroRol;
      return cumpleTexto && cumpleRol;
    });
  }

  contarPorRol(rol: string): number {
    return this.listaUsuarios.filter(u => u.rol === rol).length;
  }

  cerrarSesionAdmin(): void {
    this.autentificacionService.logout();
    this.listaUsuarios = [];
    this.usuariosFiltrados = [];
    this.router.navigate(['/']);
  }

  // === MÉTODOS DEL FORMULARIO MODAL (CREAR / EDITAR) ===

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.usuarioEnEdicionOriginal = null;
    this.idUsuarioForm = undefined;
    this.usuarioForm = '';
    this.contrasenaForm = '';
    this.rolForm = 'SUSCRIPTOR';
    this.modalFormularioAbierto = true;
  }

  editarUsuario(usuario: UsuarioSistema): void {
    this.modoEdicion = true;
    this.usuarioEnEdicionOriginal = usuario;
    this.idUsuarioForm = usuario.id;
    this.usuarioForm = usuario.usuario;
    this.contrasenaForm = '';
    this.rolForm = usuario.rol;
    this.modalFormularioAbierto = true;
  }

  guardarUsuario(): void {
    if (!this.usuarioForm.trim()) {
      alert('Por favor, ingresa el nombre de usuario.');
      return;
    }
    if (!this.modoEdicion && !this.contrasenaForm.trim()) {
      alert('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    const urlBase = 'http://localhost:8080/api/usuarios';
    let payload: any = {
      usuario: this.usuarioForm,
      rol: this.rolForm
    };

    if (this.contrasenaForm.trim()) {
      payload.contrasena = this.contrasenaForm;
    }

    const opcionesRequest = {
      headers: this.autentificacionService.getHeaders().headers,
      responseType: 'text' as 'json'
    };

    if (this.modoEdicion) {
      const urlPut = `${urlBase}/actualizar/${this.idUsuarioForm}`;

      if (!this.contrasenaForm.trim() && this.usuarioEnEdicionOriginal) {
        payload.contrasena = this.usuarioEnEdicionOriginal.contrasena;
      }

      this.http.put(urlPut, payload, opcionesRequest).subscribe({
        next: () => {
          alert('¡Usuario actualizado correctamente!');
          this.cargarUsuarios();
          this.modalFormularioAbierto = false;
        },
        error: (err) => {
          if (err.status === 200) {
            alert('¡Usuario actualizado correctamente!');
            this.cargarUsuarios();
            this.modalFormularioAbierto = false;
          } else {
            console.error(err);
            alert(`❌ Error al actualizar usuario (${err.status}).`);
          }
        }
      });
    } else {
      const urlPost = `${urlBase}/crear`;
      this.http.post(urlPost, payload, opcionesRequest).subscribe({
        next: () => {
          alert('¡Nuevo usuario registrado con éxito!');
          this.cargarUsuarios();
          this.modalFormularioAbierto = false;
        },
        error: (err) => {
          if (err.status === 200 || err.status === 201) {
            alert('¡Nuevo usuario registrado con éxito!');
            this.cargarUsuarios();
            this.modalFormularioAbierto = false;
          } else {
            console.error(err);
            alert(`❌ Error al crear usuario (${err.status}). Puede que el nombre ya exista.`);
          }
        }
      });
    }
  }

  // === MÉTODOS DE ELIMINACIÓN ===

  pedirConfirmacionEliminar(usuario: UsuarioSistema): void {
    if (usuario.usuario === this.nombreUsuarioLogueado) {
      alert('❌ No puedes eliminar tu propia cuenta de administrador en sesión.');
      return;
    }
    this.usuarioParaEliminar = usuario;
  }

  confirmarBorradoBackend(): void {
    if (!this.usuarioParaEliminar || !this.usuarioParaEliminar.id) return;

    const urlDelete = `http://localhost:8080/api/usuarios/eliminar/${this.usuarioParaEliminar.id}`;
    const opcionesRequest = {
      headers: this.autentificacionService.getHeaders().headers,
      responseType: 'text' as 'json'
    };

    this.http.delete(urlDelete, opcionesRequest).subscribe({
      next: () => {
        alert('🗑️ Usuario eliminado correctamente del sistema.');
        this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== this.usuarioParaEliminar?.id);
        this.filtrarUsuarios();
        this.usuarioParaEliminar = null;
      },
      error: (err) => {
        if (err.status === 200) {
          alert('🗑️ Usuario eliminado correctamente del sistema.');
          this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== this.usuarioParaEliminar?.id);
          this.filtrarUsuarios();
          this.usuarioParaEliminar = null;
        } else {
          console.error(err);
          alert(`❌ No se pudo eliminar al usuario (${err.status}).`);
        }
      }
    });
  }
}
