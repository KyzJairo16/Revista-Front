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

  // Filtros superiores
  filtroTipo: string = 'TODO';
  busquedaTexto: string = '';
  publicacionSeleccionada: Publicacion | null = null;

  // Control para borrados
  publicacionParaEliminar: Publicacion | null = null;

  // === ESTADO PARA CREACIÓN Y EDICIÓN ===
  modalFormularioAbierto: boolean = false;
  modoEdicion: boolean = false;
  publicacionEnEdicionOriginal: Publicacion | null = null;

  // Campos del formulario modal
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
          tipo: 'NOTICIA' as const
        }));

        this.http.get<any[]>('http://localhost:8080/api/horoscopos/listar', this.autentificacionService.getHeaders()).subscribe({
          next: (horoscoposBack) => {
            const horoscoposMapeados = (horoscoposBack || []).map((h: any) => ({
              ...h,
              tipo: 'HOROSCOPO' as const
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

  // === MÉTODOS DEL FORMULARIO MODAL ===

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

      payload.titulo = this.tituloForm;
      payload.contenido = this.contenidoForm;
      payload.imagenUrl = this.urlImagenForm.trim() !== '' ? this.urlImagenForm : null;

      if (this.tipoForm === 'NOTICIA') {
        payload.categoria = this.categoriaForm;
        payload.fuente = payload.fuente || 'Revista Digital';
      } else {
        payload.signoZodiacal = this.tituloForm;
        payload.prediccion = this.contenidoForm;
      }
    } else {
      payload = {
        id: 0,
        titulo: this.tituloForm,
        contenido: this.contenidoForm,
        autor: this.nombreUsuarioLogueado,
        fechaPublicacion: fechaIsoActual,
        imagenUrl: this.urlImagenForm.trim() !== '' ? this.urlImagenForm : null
      };

      if (this.tipoForm === 'NOTICIA') {
        payload.categoria = 'General';
        payload.fuente = 'Revista Digital';
      } else {
        payload.signoZodiacal = this.tituloForm;
        payload.prediccion = this.contenidoForm;
      }
    }

    if (this.modoEdicion) {
      const urlRutaPut = `${urlBase}/actualizar/${this.idPublicacionForm}`;
      const opcionesRequest = {
        headers: this.autentificacionService.getHeaders().headers,
        responseType: 'text' as 'json'
      };

      this.http.put(urlRutaPut, payload, opcionesRequest).subscribe({
        next: () => {
          alert('¡Publicación actualizada con éxito!');

          this.listaPublicaciones = this.listaPublicaciones.map((pub): Publicacion => {
            if (pub.id === this.idPublicacionForm) {
              return {
                ...pub,
                titulo: this.tituloForm,
                contenido: this.contenidoForm,
                imagenUrl: this.urlImagenForm.trim() !== '' ? this.urlImagenForm : null,
                categoria: this.tipoForm === 'NOTICIA' ? this.categoriaForm : pub.categoria
              };
            }
            return pub;
          });

          this.filtrarPublicaciones();
          this.modalFormularioAbierto = false;
        },
        error: (err) => {
          if (err.status !== 200) {
            alert(`❌ Error al actualizar (${err.status}).`);
          } else {
            alert('¡Publicación actualizada con éxito!');
            this.cargarContenidoEditor();
            this.modalFormularioAbierto = false;
          }
        }
      });
    } else {
      const urlRutaPost = `${urlBase}/crear`;
      this.http.post<any>(urlRutaPost, payload, this.autentificacionService.getHeaders()).subscribe({
        next: (objetoCreado) => {
          alert('¡Nueva publicación creada con éxito!');

          const nuevaPublicacion: Publicacion = {
            id: objetoCreado && objetoCreado.id ? objetoCreado.id : Math.floor(Math.random() * 10000),
            titulo: this.tituloForm,
            contenido: this.contenidoForm,
            tipo: this.tipoForm,
            imagenUrl: this.urlImagenForm.trim() !== '' ? this.urlImagenForm : null,
            categoria: this.tipoForm === 'NOTICIA' ? 'General' : undefined,
            autor: this.nombreUsuarioLogueado,
            fechaPublicacion: fechaIsoActual
          };

          this.listaPublicaciones = [nuevaPublicacion, ...this.listaPublicaciones];
          this.filtrarPublicaciones();
          this.modalFormularioAbierto = false;
        },
        error: (err) => {
          alert(`❌ Error al crear la publicación (${err.status})`);
        }
      });
    }
  }

  // === MÉTODOS PARA ELIMINACIÓN ===

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
      next: (respuestaTexto) => {
        console.log('Borrado exitoso:', respuestaTexto);
        alert('🗑️ La publicación ha sido eliminada correctamente del servidor.');

        // Remover del estado local en memoria instantáneamente
        this.listaPublicaciones = this.listaPublicaciones.filter(p => p.id !== this.publicacionParaEliminar?.id);
        this.filtrarPublicaciones();

        this.publicacionParaEliminar = null;
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        if (err.status !== 200) {
          alert(`❌ No se pudo eliminar la publicación (${err.status}).`);
        } else {
          // Si responde con texto plano y estatus 200 pero salta por el parser
          alert('🗑️ La publicación ha sido eliminada correctamente del servidor.');
          this.listaPublicaciones = this.listaPublicaciones.filter(p => p.id !== this.publicacionParaEliminar?.id);
          this.filtrarPublicaciones();
          this.publicacionParaEliminar = null;
        }
      }
    });
  }
}
