import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AutentificacionService } from '../services/autentificacion';

@Component({
  selector: 'app-comentador',
  standalone: false,
  templateUrl: './comentador.html',
  styleUrls: ['./comentador.css']
})
export class ComentadorComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AutentificacionService);

  nombreUsuarioLogueado: string = 'Comentador';

  listaPublicaciones: any[] = [];
  noticias: any[] = [];
  horoscopos: any[] = [];

  busquedaTexto: string = '';
  filtroTipo: string = 'TODO';

  publicacionSeleccionada: any = null;
  nuevoComentarioTexto: string = '';

  ngOnInit(): void {

    if (this.authService.getRol() !== 'COMENTADOR') {
      this.router.navigate(['/']);
      return;
    }
    this.nombreUsuarioLogueado = this.authService.getUsuario() || 'Lector Crítico';
    this.cargarContenidoComentador();
  }

  cargarContenidoComentador(): void {
    const opcionesHttp = this.authService.getHeaders();

    this.http.get<any[]>('http://localhost:8080/api/noticias/listar', opcionesHttp).subscribe({
      next: (noticiasBack) => {
        const noticiasMapeadas = (noticiasBack || []).map((n: any) => ({
          ...n,
          tipo: 'NOTICIA',
          titulo: n.titulo || 'Sin Título',
          contenido: n.contenido || '',
          comentarios: n.comentarios || []
        }));

        this.http.get<any[]>('http://localhost:8080/api/horoscopos/listar', opcionesHttp).subscribe({
          next: (horoscoposBack) => {
            const horoscoposMapeadas = (horoscoposBack || []).map((h: any) => ({
              ...h,
              tipo: 'HOROSCOPO',
              titulo: h.signoZodiacal || h.titulo || 'Signo Desconocido',
              contenido: h.prediccion || h.contenido || '',
              comentarios: h.comentarios || []
            }));

            this.listaPublicaciones = [...noticiasMapeadas, ...horoscoposMapeadas];
            this.filtrarYClasificar();
          },
          error: (err) => {
            console.error('Error al cargar horóscopos:', err);
            this.listaPublicaciones = [...noticiasMapeadas];
            this.filtrarYClasificar();
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar noticias:', err);
        this.listaPublicaciones = [];
        this.filtrarYClasificar();
      }
    });
  }

  filtrarYClasificar(): void {
    const texto = this.busquedaTexto.toLowerCase().trim();

    const filtradas = this.listaPublicaciones.filter(p => {
      const cumpleTexto = (p.titulo?.toLowerCase().includes(texto) || p.contenido?.toLowerCase().includes(texto));
      const cumpleTipo = this.filtroTipo === 'TODO' || p.tipo?.toUpperCase() === this.filtroTipo.toUpperCase();
      return cumpleTexto && cumpleTipo;
    });

    this.noticias = filtradas.filter(p => p.tipo?.toUpperCase() === 'NOTICIA');
    this.horoscopos = filtradas.filter(p => p.tipo?.toUpperCase() === 'HOROSCOPO');
  }

  abrirVisorLectura(publicacion: any): void {
    this.publicacionSeleccionada = publicacion;
    this.nuevoComentarioTexto = '';
  }

  agregarComentario(): void {
    if (!this.nuevoComentarioTexto.trim()) {
      alert('Por favor, escribe un comentario válido antes de enviar.');
      return;
    }

    const comentarioFormateado = `${this.nombreUsuarioLogueado}: ${this.nuevoComentarioTexto.trim()}`;

    if (!this.publicacionSeleccionada.comentarios) {
      this.publicacionSeleccionada.comentarios = [];
    }
    this.publicacionSeleccionada.comentarios.push(comentarioFormateado);

    this.nuevoComentarioTexto = '';
    alert('¡Comentario añadido a la publicación!');
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.listaPublicaciones = [];
    this.router.navigate(['/']);
  }
}
