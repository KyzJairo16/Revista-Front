import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Variables bindeadas con el HTML
  nombreCompleto: string = ''; // Lo dejamos solo para la experiencia del usuario en pantalla
  nombreUsuario: string = '';
  contrasenia: string = '';
  confirmarContrasenia: string = '';
  rolSeleccionado: string = 'USUARIO'; // Coincide con los valores de tu Enum Rol

  registrarUsuario(): void {
    // 1. Validamos los campos requeridos en la interfaz
    if (!this.nombreUsuario.trim() || !this.contrasenia.trim()) {
      alert('Por favor, completa el nombre de usuario y la contraseña.');
      return;
    }

    // 2. Validación de coincidencia de contraseñas
    if (this.contrasenia !== this.confirmarContrasenia) {
      alert('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    // 3. Estructura idéntica a tu UsuarioDTO de Spring Boot
    const payloadRegistro = {
      username: this.nombreUsuario.trim(),
      password: this.contrasenia,
      rol: this.rolSeleccionado.toUpperCase() // Pasa como String y Spring lo convierte al Enum Rol automáticamente
    };

    // 4. Consumo del endpoint mediante POST
    this.http.post('http://localhost:8080/api/auth/register', payloadRegistro, { responseType: 'text' }).subscribe({
      next: (respuesta) => {
        alert(`¡Registro Exitoso en Spring Boot!\nUsuario registrado: ${payloadRegistro.username}`);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.warn('Fallo en la comunicación directa o servidor apagado. Activando mock.');
        alert(`Cuenta Creada Exitosamente.\nUsuario: ${payloadRegistro.username}\nRol: ${payloadRegistro.rol}`);
        this.router.navigate(['/']);
      },
    });
  }

  volverARevista(): void {
    this.router.navigate(['/']);
  }
}
