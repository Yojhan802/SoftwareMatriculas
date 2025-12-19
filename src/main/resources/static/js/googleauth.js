async function generarQr() {
    const usuario = document.getElementById("inputUsuario").value.trim();
    if (!usuario) return alert("Ingrese el usuario del director.");

    try {
      const response = await fetch(
        `/api/2fa/generar-qr/${encodeURIComponent(usuario)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Convertimos la URL QR a imagen usando API de Google Charts
        const qrImg = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(
          data.qrUrl
        )}`;
        document.getElementById("qrImage").src = qrImg;
        document.getElementById("claveSecreta").textContent = data.claveSecreta;
        document.getElementById("qrContainer").style.display = "block";
      } else {
        throw new Error(data.message || "Error generando QR");
      }
    } catch (error) {
      alert("❌ " + error.message);
    }
  }