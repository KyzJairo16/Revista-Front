import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AutentificacionService } from '../services/autentificacion';

interface Publicacion {
  id?: number;
  titulo: string;
  contenido: string;
  tipo: 'NOTICIA' | 'HOROSCOPO';
  comentarios?: string[];
  imagenUrl?: string | null;
  categoria?: string;
  fuente?: string;
  signoZodiacal?: string;
  prediccion?: string;
  fechaPublicacion?: string;
  autor?: string;
}

@Component({
  selector: 'app-perfil-editor',
  standalone: false,
  templateUrl: './perfil-editor.html',
  styleUrl: './perfil-editor.css'
})
export class PerfilEditorComponent implements OnInit {
  public autentificacionService = inject(AutentificacionService);
  private router = inject(Router);
  private http = inject(HttpClient);

  nombreUsuarioLogueado: string = 'Usuario';
  listaPublicaciones: Publicacion[] = [];
  noticias: Publicacion[] = [];
  horoscopos: Publicacion[] = [];

  filtroTipo: string = 'TODO';
  busquedaTexto: string = '';
  publicacionSeleccionada: Publicacion | null = null;
  publicacionParaEliminar: Publicacion | null = null;

  modalFormularioAbierto: boolean = false;
  modoEdicion: boolean = false;
  publicacionEnEdicionOriginal: Publicacion | null = null;

  idPublicacionForm: number | undefined = undefined;
  tituloForm: string = '';
  contenidoForm: string = '';
  tipoForm: 'NOTICIA' | 'HOROSCOPO' = 'NOTICIA';
  urlImagenForm: string = '';
  categoriaForm: string = 'General';

  ngOnInit(): void {
    if (this.autentificacionService.getRol() !== 'EDITOR') {
      this.router.navigate(['/']);
      return;
    }
    this.nombreUsuarioLogueado = this.autentificacionService.getUsuario() || 'Editor Conectado';
    this.cargarContenidoEditor();
  }

  cargarContenidoEditor(): void {
    this.http.get<any[]>('http://localhost:8080/api/noticias/listar', this.autentificacionService.getHeaders()).subscribe({
      next: (noticiasBack) => {
        const noticiasMapeadas = (noticiasBack || []).map((n: any) => ({
          ...n,
          tipo: 'NOTICIA' as const,
          titulo: n.titulo || 'Sin Título',
          contenido: n.contenido || ''
        }));

        this.http.get<any[]>('http://localhost:8080/api/horoscopos/listar', this.autentificacionService.getHeaders()).subscribe({
          next: (horoscoposBack) => {
            const horoscoposMapeados = (horoscoposBack || []).map((h: any) => ({
              ...h,
              tipo: 'HOROSCOPO' as const,
              titulo: h.signoZodiacal || h.titulo || 'Signo Desconocido',
              contenido: h.prediccion || h.contenido || ''
            }));

            this.listaPublicaciones = [...noticiasMapeadas, ...horoscoposMapeados];
            this.filtrarPublicaciones();
          },
          error: (err) => {
            console.error('Error al listar horóscopos:', err);
            this.listaPublicaciones = [...noticiasMapeadas];
            this.filtrarPublicaciones();
          }
        });
      },
      error: (err) => {
        console.error('Error al listar noticias:', err);
        this.limpiarEstadoLocal();
      }
    });
  }

  filtrarPublicaciones(): void {
    const texto = this.busquedaTexto.toLowerCase().trim();
    const filtrados = this.listaPublicaciones.filter(p => {
      const cumpleTexto = p.titulo.toLowerCase().includes(texto) || p.contenido.toLowerCase().includes(texto);
      const cumpleTipo = this.filtroTipo === 'TODO' || p.tipo === this.filtroTipo;
      return cumpleTexto && cumpleTipo;
    });

    this.noticias = filtrados.filter(p => p.tipo === 'NOTICIA');
    this.horoscopos = filtrados.filter(p => p.tipo === 'HOROSCOPO');
  }

  abrirPublicacion(pub: Publicacion): void {
    if (!this.modalFormularioAbierto && !this.publicacionParaEliminar) {
      this.publicacionSeleccionada = pub;
    }
  }

  limpiarEstadoLocal(): void {
    this.listaPublicaciones = [];
    this.noticias = [];
    this.horoscopos = [];
  }

  cerrarSesionEditor(): void {
    this.autentificacionService.logout();
    this.limpiarEstadoLocal();
    this.router.navigate(['/']);
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.publicacionEnEdicionOriginal = null;
    this.idPublicacionForm = undefined;
    this.tituloForm = '';
    this.contenidoForm = '';
    this.tipoForm = 'NOTICIA';
    this.urlImagenForm = '';
    this.categoriaForm = 'General';
    this.modalFormularioAbierto = true;
  }

  editarItem(item: Publicacion): void {
    this.publicacionSeleccionada = null;
    this.modoEdicion = true;
    this.publicacionEnEdicionOriginal = item;

    this.idPublicacionForm = item.id;
    this.tituloForm = item.titulo;
    this.contenidoForm = item.contenido;
    this.tipoForm = item.tipo;
    this.urlImagenForm = item.imagenUrl || '';
    this.categoriaForm = item.categoria || 'General';

    this.modalFormularioAbierto = true;
  }

  guardarPublicacion(): void {
    if (!this.tituloForm.trim() || !this.contenidoForm.trim()) {
      alert('Por favor, completa los campos requeridos antes de guardar.');
      return;
    }

    const urlBase = this.tipoForm === 'NOTICIA'
      ? 'http://localhost:8080/api/noticias'
      : 'http://localhost:8080/api/horoscopos';

    const fechaIsoActual = new Date().toISOString().split('.')[0];
    let payload: any = {};

    if (this.modoEdicion && this.publicacionEnEdicionOriginal) {
      payload = { ...this.publicacionEnEdicionOriginal };
      payload.titulo = this.tituloForm.trim();
      payload.contenido = this.contenidoForm.trim();
      payload.imagenUrl = this.urlImagenForm.trim() !== '' ? this.urlImagenForm.trim() : null;

      if (this.tipoForm === 'NOTICIA') {
        payload.categoria = this.categoriaForm;
        payload.fuente = payload.fuente || 'Revista Digital';
      } else {
        payload.signoZodiacal = this.tituloForm.trim();
        payload.prediccion = this.contenidoForm.trim();
      }
    } else {
      payload = {
        id: null, // Dejar en null para evitar colisiones con GenerationType.IDENTITY en Hibernate
        titulo: this.tituloForm.trim(),
        contenido: this.contenidoForm.trim(),
        imagenUrl: this.urlImagenForm.trim() !== '' ? this.urlImagenForm.trim() : null
      };

      if (this.tipoForm === 'NOTICIA') {
        payload.autor = this.nombreUsuarioLogueado;
        payload.fechaPublicacion = fechaIsoActual;
        payload.categoria = 'General';
        payload.fuente = 'Revista Digital';
      } else {
        payload.fechaPublicacion = fechaIsoActual;
        payload.signoZodiacal = this.tituloForm.trim();
        payload.prediccion = this.contenidoForm.trim();
      }
    }

    const opcionesRequest = {
      headers: this.autentificacionService.getHeaders().headers,
      responseType: 'text' as 'json'
    };

    if (this.modoEdicion) {
      const urlRutaPut = `${urlBase}/actualizar/${this.idPublicacionForm}`;

      this.http.put(urlRutaPut, payload, opcionesRequest).subscribe({
        next: () => {
          alert('¡Publicación actualizada con éxito!');
          this.cargarContenidoEditor();
          this.modalFormularioAbierto = false;
        },
        error: (err) => {
          if (err.status === 200 || err.status === 201) {
            alert('¡Publicación actualizada con éxito!');
            this.cargarContenidoEditor();
            this.modalFormularioAbierto = false;
          } else {
            console.error(err);
            alert(`❌ Error al actualizar (${err.status}).`);
          }
        }
      });
    } else {
      const urlRutaPost = `${urlBase}/crear`;

      this.http.post(urlRutaPost, payload, opcionesRequest).subscribe({
        next: () => {
          alert('¡Nueva publicación creada con éxito!');
          this.cargarContenidoEditor();
          this.modalFormularioAbierto = false;
        },
        error: (err) => {
          if (err.status === 200 || err.status === 201) {
            alert('¡Nueva publicación creada con éxito!');
            this.cargarContenidoEditor();
            this.modalFormularioAbierto = false;
          } else {
            console.error(err);
            alert(`❌ Error al crear la publicación (${err.status})`);
          }
        }
      });
    }
  }

  pedirConfirmacionEliminar(item: Publicacion): void {
    this.publicacionSeleccionada = null;
    this.publicacionParaEliminar = item;
  }

  confirmarBorradoBackend(): void {
    if (!this.publicacionParaEliminar || !this.publicacionParaEliminar.id) return;

    const tipo = this.publicacionParaEliminar.tipo;
    const urlBase = tipo === 'NOTICIA'
      ? 'http://localhost:8080/api/noticias'
      : 'http://localhost:8080/api/horoscopos';

    const urlRutaDelete = `${urlBase}/eliminar/${this.publicacionParaEliminar.id}`;

    const opcionesRequest = {
      headers: this.autentificacionService.getHeaders().headers,
      responseType: 'text' as 'json'
    };

    this.http.delete(urlRutaDelete, opcionesRequest).subscribe({
      next: () => {
        alert('🗑️ La publicación ha sido eliminada correctamente del servidor.');
        this.listaPublicaciones = this.listaPublicaciones.filter(p => p.id !== this.publicacionParaEliminar?.id);
        this.filtrarPublicaciones();
        this.publicacionParaEliminar = null;
      },
      error: (err) => {
        if (err.status === 200 || err.status === 201) {
          alert('🗑️ La publicación ha sido eliminada correctamente del servidor.');
          this.listaPublicaciones = this.listaPublicaciones.filter(p => p.id !== this.publicacionParaEliminar?.id);
          this.filtrarPublicaciones();
          this.publicacionParaEliminar = null;
        } else {
          console.error('Error al eliminar:', err);
          alert(`❌ No se pudo eliminar la publicación (${err.status}).`);
        }
      }
    });
  }
}
