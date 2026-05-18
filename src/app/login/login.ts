import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html', // <-- Apuntando correctamente a su propio HTML
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Propiedades bindeades con [(ngModel)] en la vista
  nombreCompleto: string = '';
  nombreUsuario: string = '';
  contrasenia: string = '';
  confirmarContrasenia: string = '';
  rolSeleccionado: string = 'USUARIO';

  registrarUsuario(): void {
    // 1. Validaciones de campos vacíos
    if (!this.nombreUsuario.trim() || !this.contrasenia.trim()) {
      alert('Por favor, completa el nombre de usuario y la contraseña.');
      return;
    }

    // 2. Validación de coincidencia de contraseñas
    if (this.contrasenia !== this.confirmarContrasenia) {
      alert('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    // 3. Normalización del Rol elegido para Spring Security
    let rolFinal = this.rolSeleccionado.toUpperCase().trim();
    if (rolFinal === 'SIN_AUTENTICAR') {
      rolFinal = 'USUARIO'; // Fallback de seguridad en caso de inconsistencia
    }

    // 4. Estructura del payload DTO para el AuthController de Java
    const payloadRegistro = {
      username: this.nombreUsuario.trim(),
      password: this.contrasenia,
      rol: rolFinal
    };

    const opcionesRequest = {
      responseType: 'text' as 'json'
    };

    // 5. Consumo del endpoint REST con Spring Boot
    this.http.post('http://localhost:8080/api/auth/register', payloadRegistro, opcionesRequest).subscribe({
      next: (respuesta) => {
        alert(`¡Registro Exitoso en el Servidor!\nUsuario registrado: ${payloadRegistro.username}`);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error capturado durante el registro:', err);

        if (err.status === 409 || err.status === 400) {
          alert('❌ Error: El nombre de usuario ya se encuentra registrado en el sistema.');
        } else if (err.status === 200 || err.status === 201) {
          alert(`¡Registro Exitoso!\nUsuario registrado: ${payloadRegistro.username}`);
          this.router.navigate(['/']);
        } else {
          alert(`❌ No se pudo crear la cuenta. Servidor inaccesible o código de error: ${err.status}`);
        }
      }
    });
  }

  volverARevista(): void {
    this.router.navigate(['/']);
  }
}
