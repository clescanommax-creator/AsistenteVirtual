// app.js
document.addEventListener('DOMContentLoaded', function () {
  // Obtener los elementos del DOM

  const chatIcon = document.getElementById('chat-icon');
  const chatWindow = document.getElementById('chat-window');
  const closeButton = document.getElementById('close-btn');
  const sendButton = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatBody = document.querySelector('.chat-body');
  const despedida = 'Parece que no hay actividad. Si necesitás algo más, escribime!. ¡Hasta pronto!';
  const saludo = generarSaludo();
  const IconAdjuntar = document.querySelector('.file-upload');

  let inactividadTimer;
  let respuestas = {};
  let alias = {};
  let chatIniciado = false;
  let esperandoEmail = false;
  let estado = "normal";
  HabilitarAdj(false);
  cargarRespuestasDesdeGoogle();//cargamos el menu desde nuestro archivo.
  console.log(respuestas["menu"]);
  cerrarChat();// Inicialmente, el chat está oculto y el icono visible.
  let datosContacto = { nombre: null, telefono: null };



  // Mostramos la ventana de chat y ocultamos el icono.
  chatIcon.addEventListener('click', async () => {
    console.log("entrandoal ping");
    PingRender();

    if (chatIniciado == false) {
      await cargarRespuestasDesdeGoogle();
      console.log(respuestas["menu"]);

      let mensajeInicial = generarSaludo();
      agregarMensaje(mensajeInicial, 'bot');
      let menu = respuestas["menu"];
      agregarMensaje(menu, 'bot');
      agregarMensaje("Ingresa el numero de la opcion! ", 'bot');
      chatIniciado = true;
    }
    chatWindow.style.display = 'flex';  // Mostrar la ventana del chat
    chatIcon.style.display = 'none';    // Ocultar el icono de chat
    userInput.focus();
    reiniciarInactividad();

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
      estados[estado](userMessage);

      reiniciarInactividad();
    }
  });

  /*Funcion para el boton "enter" del teclado*/
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const userMessage = userInput.value.trim();
      if (userMessage !== "") {

        agregarMensaje(userMessage, 'user');
        userInput.value = ''; // Limpiar el input

        estados[estado](userMessage);

        reiniciarInactividad();
      }
    }
  });

  //funcion para el boton adjuntar
  document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      agregarMensaje(` Subiendo archivo: ${file.name}`, 'user');
      estados[estado](file);
    }

  });


  /**/

  //######################Envio de informacion al sheet##############################

  const estados = {
    esperandoEmail: (msj) => {
      if (validarEmail(msj)) {
        normalizarTexto(msj);
        enviarEmailAGoogleSheets(msj);
        estado = "normal";
      } else {
        agregarMensaje("Ese correo no parece válido. Intentá de nuevo.", 'bot');
      }
    },

    esperandoNoticia: (msj) => {
      console.log("Entro al objeto estados, noticia: " + msj);
      //normalizarTexto(msj);
      procesarNoticia(msj);
      estado = "normal";
    },

    esperandoPdf: (archivo) => {
      if (typeof archivo === "string") {
        const texto = normalizarTexto(archivo);
        if (texto === "0" || texto === "menu" || texto === "volver") {
          reiniciarConversacion();
          return;
        }
        // Si no es eso, avisamos que debe adjuntar un archivo
        agregarMensaje("Por favor, adjunta tu Curriculum Vitae o escribí 0 para volver al menú principal.", "bot");
        return;
      }

      enviarPDF(archivo);
      HabilitarAdj(false);
      estado = "normal";
    },
    esperandoContacto: (msj) => {
      if (msj === "0" || msj === "menu" || msj === "volver") {
        reiniciarConversacion();
        return;
      }
      // Si aún no tenemos nombre, lo guardamos
      if (!datosContacto.nombre) {
        datosContacto.nombre = msj.trim();
        agregarMensaje("Gracias " + datosContacto.nombre + ". Ahora ingresá tu número de teléfono:", "bot");
        return;
      }

      // Si ya tenemos nombre, ahora esperamos teléfono
      if (!datosContacto.telefono) {
        const telefono = msj.trim().replace(/\s+/g, '');
        if (!/^\d{6,15}$/.test(telefono)) {
          agregarMensaje("El número no parece válido. Ingresalo sin espacios ni guiones.", "bot");
          return;
        }

        datosContacto.telefono = telefono;

        // Enviar a Google Sheets
        enviarContactoAGoogleSheets(datosContacto.nombre, datosContacto.telefono);

        // Reiniciar el registro temporal
        datosContacto = { nombre: null, telefono: null };
        estado = "normal";
      }
    },

    normal: (msg) => {
      setTimeout(() => {
        const botResponse = getBotRespuesta(msg);
        if (botResponse) agregarMensaje(botResponse, 'bot');
      }, 1000);
    }
  };

  function enviarEmailAGoogleSheets(email) {
    fetch('https://asistentevirtual-s3d5.onrender.com/enviar-email', {//fetch('http://localhost:3000/enviar-email', {// /*'https://mi-backend-ciudadano-clescanommax.replit.app/enviar-email', {/*('http://localhost:3000/enviar-email', {*/
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
      .then(response => response.json())
      .then(data => {


        if (data.status === 'OK') {
          agregarMensaje("¡Gracias! Te agregamos a la lista para recibir los titulares diarios.", 'bot');//Email guardado correctamente. ¡Gracias!
        } else {
          agregarMensaje("Hubo un problema al guardar tu email. Intenta nuevamente.", 'bot');
        }
      })
      .catch(error => {
        console.error("Error al enviar al backend:", error);
        agregarMensaje("No se pudo guardar el email. Intentalo más tarde.", 'bot');
        //console.log("Entro aca enviaremail()");
      });
  }

  function enviarContactoAGoogleSheets(nombre, telefono) {
    fetch('https://asistentevirtual-s3d5.onrender.com/enviar-contacto', { // o tu endpoint en Render
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono })
    })
      .then(response => response.json())
      .then(data => {

        console.log("Respuesta del backend:", data);

        if (data.status === 'OK') {
          agregarMensaje("¡Perfecto! Te registramos correctamente.", 'bot');
        } else {
          agregarMensaje("Hubo un problema al guardar tus datos. Intentalo nuevamente.", 'bot');
        }
      })
      .catch(error => {
        console.error("Error al enviar el contacto:", error);
        agregarMensaje("No se pudo guardar la información. Intentalo más tarde.", 'bot');
      });
  }


  function procesarNoticia(noticia) {
    // Mostramos un mensaje de espera opcional
    agregarMensaje("Procesando tu noticia...", 'bot');

    fetch('https://asistentevirtual-s3d5.onrender.com/enviarNoticia', {//fetch('https://asistentevirtual-s3d5.onrender.com/enviarNoticia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticia: noticia })  // enviamos la noticia tal cual body: JSON.stringify({ type: "noticia", contenido: noticia }) //
    })
      .then(response => response.json())
      .then(data => {
        console.log("Entró a procesarNoticia");
        console.log("Respuesta del backend:", data);
        console.log("Tipo de respuesta:", typeof data);

        if (data.status === 'OK') {
          agregarMensaje("¡Gracias por tu colaboración!", 'bot'); // todo OK
        } else if (data.status === 'ERROR' && data.message) {
          agregarMensaje(`Hubo un problema: ${data.message}`, 'bot'); // error con mensaje del backend
        } else {
          agregarMensaje("Hubo un problema al guardar tu nota. Intenta nuevamente.", 'bot'); // error genérico
        }
      })
      .catch(error => {
        console.error("Error al enviar al backend:", error);
        agregarMensaje("No se pudo guardar la nota. Inténtalo más tarde.", 'bot');
      });
  }

  function enviarPDF(archivo) {
    const formData = new FormData();
    formData.append("archivo", archivo);

    fetch("https://asistentevirtual-s3d5.onrender.com/enviarPDF", {
      method: "POST",
      body: formData
    })
      // ⚡ CAMBIO: Usamos async para manejar el parseo de JSON de manera segura
      .then(async res => {
        // ⚡ CAMBIO: Capturamos errores al hacer res.json()
        const data = await res.json().catch(() => ({
          status: "ERROR",
          message: "Respuesta no válida del servidor"
        }));

        console.log("Respuesta del backend:", data);

        if (data.status === "OK") {
          agregarMensaje("PDF guardado correctamente.", "bot");
        } else {
          // ⚡ CAMBIO: Mostramos mensaje real del backend
          agregarMensaje(`Hubo un problema al subir el PDF: ${data.message}`, "bot");
        }
      })
      // ❌ No se cambió: Manejo de errores de red sigue igual
      .catch(err => {
        console.error("Error al enviar PDF:", err);
        agregarMensaje("Error al subir el archivo. Inténtalo más tarde.", "bot");
      });
  }

  function reiniciarConversacion() {
    console.log("Reiniciando conversación...");

    // Limpiamos el historial del chat
    chatBody.innerHTML = '';

    // Reseteamos los estados
    estado = "normal";
    esperandoEmail = false;
    chatIniciado = true;

    // Deshabilitamos el botón de adjuntar
    HabilitarAdj(false);

    // Mostramos el saludo inicial y el menú principal
    agregarMensaje(saludo, 'bot');

    if (respuestas['menu']) {
      agregarMensaje(respuestas['menu'], 'bot');
    } else {
      agregarMensaje("Menú principal no disponible en este momento.", 'bot');
    }

    reiniciarInactividad();
  }
    // Función para generar respuestas automáticas del bot
  function getBotRespuesta(texto) {
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

    const clave = alias[consulta] || consulta; //  resuelve alias si existe
    let respuesta = respuestas[clave];        //  busca el contenido real
    console.log(respuesta);
    console.log("la clave es " + clave);
    if (clave === "11") {// Agregar una nota
      console.log("cambio de estado 11");
      estado = "esperandoNoticia";
    }
    if (clave === "12") {//suscripcion de titulares
      estado = "esperandoEmail";
    }
    if (consulta === "2") {// Opcion adjuntar

      HabilitarAdj(true);
      estado = "esperandoPdf";

    }
    if (clave === "41") {
      estado = "esperandoContacto";
      datosContacto = { nombre: null, telefono: null };
      agregarMensaje("Perfecto. Decime tu nombre para comenzar: ", "bot");
      return "";
    }
    if (consulta === "menu" || consulta === "0" || consulta === "volver") {
      reiniciarConversacion();
      return "";
    }



    // Limpiar la respuesta si contiene comas extra o espacios al final
    if (respuesta) {
      // Eliminar comas extra al final y limpiar espacios innecesarios
      respuesta = respuesta.trim().replace(/,+$/, '');
      respuesta = respuesta.trim().replace(/["]/g, '');
    }

    if (respuesta && respuesta !== clave) {
      return respuesta;/*agregarMensaje('', respuesta);*/
    } else {
      const fallback = respuestas['menu'];
      return (' Lo siento, no puedo responder: <br><br>' + fallback);
    }
  }

//######################Funciones auxiliares##############################

  
  // Función para mostrar los mensajes en el chat
  function agregarMensaje(message, sender) {

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender);

    // Detectar si el mensaje contiene una URL

    if (!/<[a-z][\s\S]*>/i.test(message.trim())) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      if (urlRegex.test(message)) {
        // Reemplazar las URLs en el mensaje por un enlace HTML
        message = message.replace(urlRegex, (url) => {
          return `<a href="${url}" target="_blank" class="chat-link">${url}</a>`;
        });
      }

      messageDiv.innerHTML = `<p>${message}</p>`;
    } else {
      messageDiv.innerHTML = message;
    }
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;  // Hacer scroll al último mensaje

  }

  //habilitar boton adjuntar
  function HabilitarAdj(band) {

    if (band) {
      IconAdjuntar.style.pointerEvents = 'auto'; // se puede hacer clic
      IconAdjuntar.style.opacity = '1'; // se ve normal
    }
    else {
      IconAdjuntar.style.pointerEvents = 'none'; // se puede hacer clic
      IconAdjuntar.style.opacity = '0.4'; // se ve normal
    }

  }

  //Funcion para cargar el menu desde google
  function cargarRespuestasDesdeGoogle() {
    fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0VfY9dKnLiKbHAtafLiPRGTSon6hewj0CejoKmcsuOE5zepSo9h_6onap12Gk3U5XxoCLxMUf89Ar/pub?gid=0&single=true&output=csv')

      .then(response => response.text())
      .then(data => {
        const filas = data.split('\n');
        const temp = {};

        //  cargar todo en un objeto temporal
        filas.forEach((fila, index) => {
          if (index === 0) return; // salta encabezado
          const [entradaRaw, ...contenidoRaw] = fila.split(',');
          const entrada = normalizarTexto(entradaRaw);
          const contenido = contenidoRaw.join(',').trim().replace(/,$/, '').replace(/^"(.*)"$/, '$1');

          if (entrada && contenido) {
            temp[entrada] = contenido;
          }
        });

        // separar claves y alias
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

      setTimeout(() => {
        cerrarChat();
      }, 2000); // // Segundos para que se lea el mensaje
    }, 60 * 1000); // tiempo de espera antes de mostrar el msj

  }

  //Funcion para chat oculto y el icono visible.
  function cerrarChat() {

    chatWindow.style.display = 'none';  // Ocultar la ventana de chat
    chatIcon.style.display = 'flex';    // Mostrar el icono de chat nuevamente
    chatBody.innerHTML = '';  // Eliminar todos los mensajes en el chat
    chatIniciado = false;

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
    if (hora < 12) return '¡Buenos días! ';
    if (hora < 18) return '¡Buenas tardes! ';
    return '¡Buenas noches! ';
  }

  function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim().toLowerCase());//email.toLowerCase());
  }
  //despierta el render
  const PingRender = async () => {
    try {
      const response = await fetch('https://asistentevirtual-s3d5.onrender.com/ping');
      if (response.ok) {
        console.log(' App de Render despertada correctamente');
      } else {
        console.log(`Error al despertar la app. Código: ${response.status}`);
      }
    } catch (error) {
      console.error(' Error al hacer el ping:', error.message);
    }
  };


});



/*fin asistente*/
