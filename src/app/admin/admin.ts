import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AutentificacionService } from '../services/autentificacion';

interface UsuarioSistema {
  id?: number;
  username: string;
  contrasena?: string;
  rol: string;
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

  busquedaTexto: string = '';
  filtroRol: string = 'TODO';

  modalFormularioAbierto: boolean = false;
  modoEdicion: boolean = false;
  usuarioParaEliminar: UsuarioSistema | null = null;
  usuarioEnEdicionOriginal: UsuarioSistema | null = null;

  idUsuarioForm: number | undefined = undefined;
  usuarioForm: string = '';
  contrasenaForm: string = '';
  rolForm: string = 'USUARIO';

  ngOnInit(): void {
    const rolCrudo = this.autentificacionService.getRol();
    const rolGuardado = rolCrudo ? rolCrudo.toUpperCase().trim() : '';

    if (rolGuardado !== 'ADMINISTRADOR' && rolGuardado !== 'ADMINISTRATIVO') {
      console.warn('⚠️ Acceso Denegado. Redirigiendo por falta de permisos.');
      this.router.navigate(['/']);
      return;
    }

    this.nombreUsuarioLogueado = this.autentificacionService.getUsuario() || 'Admin Central';
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.http.get<any[]>('http://localhost:8080/api/usuarios/listar', this.autentificacionService.getHeaders()).subscribe({
      next: (data) => {
        this.listaUsuarios = (data || []).map(u => {
          let rolMapeado = u.rol ? u.rol.toUpperCase().trim() : 'USUARIO';
          if (rolMapeado === 'SUSCRIPTOR') {
            rolMapeado = 'USUARIO';
          }
          return {
            id: u.id,
            username: u.username || '',
            rol: rolMapeado
          };
        });

        if (this.filtroRol === 'TODO' && !this.busquedaTexto.trim()) {
          this.usuariosFiltrados = [...this.listaUsuarios];
        } else {
          this.filtrarUsuarios();
        }
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
      const nombreMapeado = u.username ? u.username.toLowerCase() : '';
      const cumpleTexto = nombreMapeado.includes(texto);

      if (this.filtroRol === 'TODO') {
        return cumpleTexto;
      }

      const filtroLimpio = this.filtroRol.toUpperCase().trim();
      if (filtroLimpio === 'ADMINISTRATIVO' || filtroLimpio === 'ADMINISTRADOR') {
        return cumpleTexto && (u.rol === 'ADMINISTRADOR' || u.rol === 'ADMINISTRATIVO');
      }

      return cumpleTexto && u.rol === filtroLimpio;
    });
  }

  contarPorRol(rol: string): number {
    if (!this.listaUsuarios) return 0;
    const targetRol = rol.toUpperCase().trim();

    if (targetRol === 'ADMINISTRATIVO' || targetRol === 'ADMINISTRADOR') {
      return this.listaUsuarios.filter(u => u.rol === 'ADMINISTRADOR' || u.rol === 'ADMINISTRATIVO').length;
    }

    return this.listaUsuarios.filter(u => u.rol === targetRol).length;
  }

  cerrarSesionAdmin(): void {
    this.autentificacionService.logout();
    this.listaUsuarios = [];
    this.usuariosFiltrados = [];
    this.router.navigate(['/']);
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.usuarioEnEdicionOriginal = null;
    this.idUsuarioForm = undefined;
    this.usuarioForm = '';
    this.contrasenaForm = '';
    this.rolForm = 'USUARIO';
    this.modalFormularioAbierto = true;
  }

  editarUsuario(usuario: UsuarioSistema): void {
    this.modoEdicion = true;
    this.usuarioEnEdicionOriginal = usuario;
    this.idUsuarioForm = usuario.id;
    this.usuarioForm = usuario.username;
    this.contrasenaForm = '';
    this.rolForm = usuario.rol === 'SUSCRIPTOR' ? 'USUARIO' : usuario.rol;
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

    let rolFinal = this.rolForm.toUpperCase().trim();
    if (rolFinal === 'ADMINISTRADOR') {
      rolFinal = 'ADMINISTRATIVO';
    }

    let payload: any = {
      username: this.usuarioForm.trim(),
      rol: rolFinal
    };

    if (this.contrasenaForm.trim()) {
      payload.password = this.contrasenaForm;
    }


    const opcionesRequest = {
      headers: this.autentificacionService.getHeaders().headers,
      responseType: 'text' as 'json'
    };

    if (this.modoEdicion) {
      const urlPut = `${urlBase}/actualizar/${this.idUsuarioForm}`;

      if (!this.contrasenaForm.trim() && this.usuarioEnEdicionOriginal) {
        payload.password = this.usuarioEnEdicionOriginal.contrasena;
      }

      this.http.put(urlPut, payload, opcionesRequest).subscribe({
        next: () => {
          alert('¡Usuario actualizado con éxito!');
          this.cargarUsuarios();
          this.modalFormularioAbierto = false;
        },
        error: (err) => {
          if (err.status === 200 || err.status === 201) {
            alert('¡Usuario actualizado con éxito!');
            this.cargarUsuarios();
            this.modalFormularioAbierto = false;
          } else {
            console.error(err);
            alert(` Error al actualizar usuario.`);
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
            alert(` Error al crear usuario. Puede que el nombre ya exista.`);
          }
        }
      });
    }
  }

  pedirConfirmacionEliminar(usuario: UsuarioSistema): void {
    if (usuario.username === this.nombreUsuarioLogueado) {
      alert(' No puedes eliminar tu propia cuenta de administrativo en sesión.');
      return;
    }
    this.usuarioParaEliminar = usuario;
  }

  confirmarBorradoBackend(): void {
    if (!this.usuarioParaEliminar || !this.usuarioParaEliminar.id) return;

    const urlDelete = `http://localhost:8080/api/usuarios/eliminar/${this.usuarioParaEliminar.id}`;

    // CORRECCIÓN TS2769: Mapeo explícito usando el casteo seguro con cabeceras JWT activas
    const opcionesRequest = {
      headers: this.autentificacionService.getHeaders().headers,
      responseType: 'text' as 'json'
    };

    this.http.delete(urlDelete, opcionesRequest).subscribe({
      next: () => {
        alert(' Usuario eliminado correctamente.');
        this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== this.usuarioParaEliminar?.id);
        this.filtrarUsuarios();
        this.usuarioParaEliminar = null;
      },
      error: (err) => {
        if (err.status === 200 || err.status === 201) {
          alert('🗑️ Usuario eliminado correctamente.');
          this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== this.usuarioParaEliminar?.id);
          this.filtrarUsuarios();
          this.usuarioParaEliminar = null;
          return;
        }

        if (err.status === 403) {
          alert(' Error 403: No posees el rol requerido (ADMINISTRATIVO) para esta acción.');
        } else {
          alert(` No se pudo eliminar al usuario. Código HTTP: ${err.status}`);
        }
      }
    });
  }
}
