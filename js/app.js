// app.js
document.addEventListener('DOMContentLoaded', function () {
  // Obtener los elementos del DOM
  
  const chatIcon = document.getElementById('chat-icon');
  const chatWindow = document.getElementById('chat-window');
  const closeButton = document.getElementById('close-btn');
  const sendButton = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatBody = document.querySelector('.chat-body');
  const despedida ='Parece que no hay actividad. Si necesitás algo más, escribime!. ¡Hasta pronto!';
  const saludo=generarSaludo();
  let inactividadTimer;	
  let respuestas = {};
  let alias = {};
  let chatIniciado= false;
  let esperandoEmail = false;
  cargarRespuestasDesdeGoogle();//cargamos el menu desde nuestro archivo.
  cerrarChat();// Inicialmente, el chat está oculto y el icono visible.
  


 // clic en el icono de chat, mostramos la ventana de chat y ocultamos el icono.
  chatIcon.addEventListener('click', () => {
	  
		if(chatIniciado==false){
			agregarMensaje(saludo,'bot');
			chatIniciado=true;
			}
		chatWindow.style.display = 'flex';  // Mostrar la ventana del chat
		chatIcon.style.display = 'none';    // Ocultar el icono de chat
		userInput.focus();
		reiniciarInactividad();
    PingRender();
  });

 //clic en el botón de cerrar, ocultamos la ventana del chat y mostramos el icono.
  closeButton.addEventListener('click', () => {
		cerrarChat();
  });
  
//Función para el botón "Enviar"
  sendButton.addEventListener('click', () => {
	     const userMessage = userInput.value.trim();
    if (userMessage !== "") {
      agregarMensaje(userMessage, 'user');
      userInput.value = ''; // Limpiar el input

      if (esperandoEmail) {
        console.log("Email ingresado:", userMessage);
        if (validarEmail(userMessage)) {
          //agregarMensaje("¡Gracias! Te agregamos a la lista para recibir los titulares diarios.", 'bot');
          enviarEmailAGoogleSheets(userMessage); 
          esperandoEmail = false;
        } else {
			console.log("Ese correo no parece válido. Intentá de nuevo");
          agregarMensaje("Ese correo no parece válido. Intentá de nuevo.", 'bot');
        }
      } else {
		  //console.log("Normal");
        // Respuesta normal del bot
        setTimeout(() => {
          const botResponse = getBotResponse(userMessage);
          if (botResponse) {
            agregarMensaje(botResponse, 'bot');
          }
        }, 1000);
      }

      reiniciarInactividad();
  }
});
    /*const userMessage = userInput.value.trim();
    if (userMessage !== "") {
      agregarMensaje(userMessage, 'user');
      userInput.value = ''; // Limpiar el input

      // Respuesta normal del bot
      setTimeout(() => {
        const botResponse = getBotResponse(userMessage);
        agregarMensaje(botResponse, 'bot');
      }, 1000);
    }
	reiniciarInactividad();
  });*/
 /*Funcion para el boton "enter" del teclado*/
 userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const userMessage = userInput.value.trim();
    if (userMessage !== "") {
      agregarMensaje(userMessage, 'user');
      userInput.value = ''; // Limpiar el input

      if (esperandoEmail) {
        console.log("Email ingresado:", userMessage);
        if (validarEmail(userMessage)) {
          //agregarMensaje("¡Gracias! Te agregamos a la lista para recibir los titulares diarios.", 'bot');
          enviarEmailAGoogleSheets(userMessage); 
          esperandoEmail = false;
        } else {
			console.log("Ese correo no parece válido. Intentá de nuevo");
          agregarMensaje("Ese correo no parece válido. Intentá de nuevo.", 'bot');
        }
      } else {
		  //console.log("Normal");
        // Respuesta normal del bot
        setTimeout(() => {
          const botResponse = getBotResponse(userMessage);
          if (botResponse) {
            agregarMensaje(botResponse, 'bot');
          }
        }, 1000);
      }

      reiniciarInactividad();
    }
  }
});

// Función para mostrar los mensajes en el chat
  function agregarMensaje(message, sender) {
	  
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender);
	
	 // Detectar si el mensaje contiene una URL
	  const urlRegex = /(https?:\/\/[^\s]+)/g;
	  if (urlRegex.test(message)) {
		// Reemplazar las URLs en el mensaje por un enlace HTML
		message = message.replace(urlRegex, (url) => {
		  return `<a href="${url}" target="_blank" class="chat-link">${url}</a>`;
		});
	  }
	
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;  // Hacer scroll al último mensaje
    
  }

 // Función para generar respuestas automáticas del bot
  function getBotResponse(texto) {	  
	  const consulta = normalizarTexto(texto);
	  
	  if (consulta.includes("chau") || consulta.includes("exit")) {// si el texto incluye chau genera saludo y cierra el chat
		setTimeout(() => {
		  agregarMensaje("¡Hasta luego! Cerrando el chat...", 'bot');
		  setTimeout(() => {
			cerrarChat();
		  }, 2000); // Espera 3 segundos para que se lea el mensaje
		}, 500);

		return ""; // No mostrar mensaje extra después
	  }
	  
	   /*if (consulta.includes("titulares")) {
		esperandoEmail = true;
		return "¡Perfecto! Para enviarte los titulares diarios, por favor escribí tu correo electrónico...";
	  }*/

	 const clave = alias[consulta] || consulta; // 🔁 resuelve alias si existe
	 let respuesta = respuestas[clave];        // 📦 busca el contenido real
		/*console.log(respuesta);*/
	if (clave === "titulares") {
		
		esperandoEmail = true;
	}
		
	// Limpiar la respuesta si contiene comas extra o espacios al final
    if (respuesta) {
        // Eliminar comas extra al final y limpiar espacios innecesarios
        respuesta = respuesta.trim().replace(/,+$/, '');
		respuesta = respuesta.trim().replace(/["]/g, ''); 
        }
				
	  if (respuesta && respuesta !== clave) {
			return respuesta;/*agregarMensaje('📰', respuesta);*/
		} else {
	  const fallback = respuestas['menu']|| 'Estas son las secciones disponibles: Noticias, Participación, Contacto, Registro.';
		return ('📰 Lo siento, no entendí tu mensaje... Podes elegir entre estas opciones: ' + fallback);
 	  }
  } 
 
 
 //Funcion para cargar el menu desde google
  function cargarRespuestasDesdeGoogle() {
	fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0VfY9dKnLiKbHAtafLiPRGTSon6hewj0CejoKmcsuOE5zepSo9h_6onap12Gk3U5XxoCLxMUf89Ar/pub?output=csv')    
    .then(response => response.text())
    .then(data => {
      const filas = data.split('\n');
      const temp = {};

      // Paso 1: cargar todo en un objeto temporal
      filas.forEach((fila, index) => {
        if (index === 0) return; // salta encabezado
        const [entradaRaw, ...contenidoRaw] = fila.split(',');
        const entrada = normalizarTexto(entradaRaw);
		const contenido = contenidoRaw.join(',').trim().replace(/,$/, '');

        if (entrada && contenido) {
          temp[entrada] = contenido;
        }
      });

      // Paso 2: separar claves y alias
      Object.entries(temp).forEach(([entrada, contenido]) => {
		const entradaNorm = normalizarTexto(entrada);
        const contenidoNormalizado = normalizarTexto(contenido);
		if (contenidoNormalizado !== entradaNorm && temp[contenidoNormalizado]) {
          alias[entrada] = contenidoNormalizado; // es alias
        } else {
          respuestas[entradaNorm] = contenido; // es respuesta directa
        }
      });
	/*console.log('Contenido de "registro":', respuestas['registro']);*/
    });

}

// Inicia o reinicia el contador de inactividad
  function reiniciarInactividad() {
	  clearTimeout(inactividadTimer);

	  inactividadTimer = setTimeout(() => {
		
		agregarMensaje(despedida, 'bot');
	    chatBody.scrollTop = chatBody.scrollHeight;  // Desplazar hacia el final

		//hablar(despedida);
		// Cierre forzado del chat después de mostrar el mensaje
		setTimeout(() => {
			cerrarChat();		  
		  }, 2000); // // Espera 3 segundos para que se lea el mensaje
	  }, 60 * 1000); // tiempo de espera antes de mostrar el msj

}

//Funcion para chat oculto y el icono visible.
  function cerrarChat(){
	
	chatWindow.style.display = 'none';  // Ocultar la ventana de chat
    chatIcon.style.display = 'flex';    // Mostrar el icono de chat nuevamente
    chatBody.innerHTML = '';  // Eliminar todos los mensajes en el chat
	chatIniciado=false;
	
}
//Funcion para normalizar el texto y enviar todo en minuscula sin acento
  function normalizarTexto(texto) {

	  return texto
		.toLowerCase() //  Convierte todo a minúsculas
		.normalize('NFD') //  Separa los caracteres acentuados (ej. "é" → "e" + acento)
		.replace(/[\u0300-\u036f]/g, '') //  Elimina los acentos
		.trim(); //  Elimina espacios al inicio y al final
}

//Funcion genera saludo segun hs del dia  
  function generarSaludo() {
    const hora = new Date().getHours();
    if (hora < 12) return '¡Buenos días! Soy el asistente del Diario Ciudadano. Si querés ver las opciones disponibles, escribí “menu”.';
    if (hora < 18) return '¡Buenas tardes! ¿Querés ver las secciones del diario? Escribí “menu”.';
    return '¡Buenas noches! Estoy acá para ayudarte. Escribí “menu” para ver las opciones disponibles.';
 }

  function validarEmail(email) {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;		
		return re.test(email.trim().toLowerCase());//email.toLowerCase());
	}

function enviarEmailAGoogleSheets(email) {
  fetch ('https://asistentevirtual-s3d5.onrender.com/enviar-email', { /*'https://mi-backend-ciudadano-clescanommax.replit.app/enviar-email', {/*('http://localhost:3000/enviar-email', {*/
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    	
	//console.log("Respuesta del backend:", data, "result:", data.result);
	//console.log("Tipo de result:", typeof data.result);
	
    if (data.status === 'OK') {
      agregarMensaje("📬 ¡Gracias! Te agregamos a la lista para recibir los titulares diarios.", 'bot');//Email guardado correctamente. ¡Gracias!
    } else {
      agregarMensaje("⚠️ Hubo un problema al guardar tu email. Intenta nuevamente.", 'bot');
    }
  })
  .catch(error => {
    console.error("Error al enviar al backend:", error);
    agregarMensaje("❌ No se pudo guardar el email. Intentalo más tarde.", 'bot');
	console.log("Entro aca enviaremail()");
  });
}

const PingRender = async () => {
  try {
    const response = await fetch('https://asistentevirtual-s3d5.onrender.com/ping');
    if (response.ok) {
      console.log('✅ App de Render despertada correctamente');
    } else {
      console.log(`⚠️ Error al despertar la app. Código: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error al hacer el ping:', error.message);
  }
};


});

/*fin asistente*/
