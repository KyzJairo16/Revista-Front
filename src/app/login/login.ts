import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private router = inject(Router);
  private http = inject(HttpClient);


  nombreCompleto: string = '';
  nombreUsuario: string = '';
  contrasenia: string = '';
  confirmarContrasenia: string = '';
  rolSeleccionado: string = 'USUARIO';

  registrarUsuario(): void {

    if (!this.nombreUsuario.trim() || !this.contrasenia.trim()) {
      alert('Por favor, completa el nombre de usuario y la contraseña.');
      return;
    }


    if (this.contrasenia !== this.confirmarContrasenia) {
      alert('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }


    let rolFinal = this.rolSeleccionado.toUpperCase().trim();
    if (rolFinal === 'SIN_AUTENTICAR') {
      rolFinal = 'USUARIO'; // Fallback de seguridad en caso de inconsistencia
    }


    const payloadRegistro = {
      username: this.nombreUsuario.trim(),
      password: this.contrasenia,
      rol: rolFinal
    };

    const opcionesRequest = {
      responseType: 'text' as 'json'
    };


    this.http.post('http://localhost:8080/api/auth/register', payloadRegistro, opcionesRequest).subscribe({
      next: (respuesta) => {
        alert(`¡Registro Exitoso en el Servidor!\nUsuario registrado: ${payloadRegistro.username}`);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error capturado durante el registro:', err);

        if (err.status === 409 || err.status === 400) {
          alert(' Error: El nombre de usuario ya se encuentra registrado en el sistema.');
        } else if (err.status === 200 || err.status === 201) {
          alert(`¡Registro Exitoso!\nUsuario registrado: ${payloadRegistro.username}`);
          this.router.navigate(['/']);
        } else {
          alert(` No se pudo crear la cuenta. Servidor inaccesible o código de error: ${err.status}`);
        }
      }
    });
  }

  volverARevista(): void {
    this.router.navigate(['/']);
  }
}
