<<<<<<< Updated upstream
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AutentificacionService } from '../services/autentificacion';
=======
import { Component } from '@angular/core';
>>>>>>> Stashed changes

@Component({
  selector: 'app-lector',
  standalone: false,
  templateUrl: './lector.html',
<<<<<<< Updated upstream
  styleUrls: ['./lector.css']
})
export class LectorComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AutentificacionService);

  // Arreglo maestro para mantener la copia intacta de la base de datos
  listaPublicaciones: any[] = [];

  // Arreglos que se renderizan en el HTML
  noticias: any[] = [];
  horoscopos: any[] = [];

  // Filtros bindeados con [(ngModel)]
  busquedaTexto: string = '';
  filtroTipo: string = 'TODO'; // Forzamos inicio limpio para ver todo

  // Control para el visor/modal de lectura detallada
  publicacionSeleccionada: any = null;

  ngOnInit(): void {
    this.cargarContenidoLector();
  }

  cargarContenidoLector(): void {
    const opcionesHttp = this.authService.getHeaders();

    // 1. Traemos las noticias reales del servidor
    this.http.get<any[]>('http://localhost:8080/api/noticias/listar', opcionesHttp).subscribe({
      next: (noticiasBack) => {
        const noticiasMapeadas = (noticiasBack || []).map((n: any) => ({
          ...n,
          tipo: 'NOTICIA',
          titulo: n.titulo || 'Sin Título',
          contenido: n.contenido || ''
        }));

        // 2. Traemos los horóscopos del servidor
        this.http.get<any[]>('http://localhost:8080/api/horoscopos/listar', opcionesHttp).subscribe({
          next: (horoscoposBack) => {
            const horoscoposMapeados = (horoscoposBack || []).map((h: any) => ({
              ...h,
              tipo: 'HOROSCOPO',
              titulo: h.signoZodiacal || h.titulo || 'Signo Desconocido',
              contenido: h.prediccion || h.contenido || ''
            }));

            // Guardamos en la lista maestra igual que hace el editor
            this.listaPublicaciones = [...noticiasMapeadas, ...horoscoposMapeados];
            this.filtrarYClasificar();
          },
          error: (err) => {
            console.error('Error al cargar horóscopos en el lector:', err);
            this.listaPublicaciones = [...noticiasMapeadas];
            this.filtrarYClasificar();
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar noticias en el lector:', err);
        this.listaPublicaciones = [];
        this.filtrarYClasificar();
      }
    });
  }

  filtrarYClasificar(): void {
    const texto = this.busquedaTexto.toLowerCase().trim();

    // 1. Filtrado por texto y tipo sobre la lista maestra
    const filtradas = this.listaPublicaciones.filter(p => {
      const cumpleTexto = (p.titulo?.toLowerCase().includes(texto) || p.contenido?.toLowerCase().includes(texto));
      const cumpleTipo = this.filtroTipo === 'TODO' || p.tipo?.toUpperCase() === this.filtroTipo.toUpperCase();
      return cumpleTexto && cumpleTipo;
    });

    // 2. Asignamos a los arreglos de la vista lo que sobrevivió al filtro
    this.noticias = filtradas.filter(p => p.tipo?.toUpperCase() === 'NOTICIA');
    this.horoscopos = filtradas.filter(p => p.tipo?.toUpperCase() === 'HOROSCOPO');
  }

  abrirVisorLectura(publicacion: any): void {
    this.publicacionSeleccionada = publicacion;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
=======
  styleUrl: './lector.css',
})
export class Lector {}
>>>>>>> Stashed changes
