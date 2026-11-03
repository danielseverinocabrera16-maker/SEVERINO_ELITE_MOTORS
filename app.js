let catalogoCompleto = { vehiculos: [], motos: [] };
let categoriaActual = 'vehiculos';
let carrito = [];
let vehiculoTemp = null;

document.addEventListener('DOMContentLoaded', () => {
    fetch('vehiculo.json')
        .then(res => res.json())
        .then(data => {
            catalogoCompleto = adaptarDatos(data);
            renderizarCatalogo();
        })
        .catch(err => console.error("Error cargando JSON:", err));
    
    rellenarDatosVIP();
    document.getElementById('alquilerFecha').value = new Date().toISOString().split('T')[0];
});

function adaptarDatos(data) {
    const procesar = (items) => items.map(item => {
        if (!item.precio_alquiler_dia) {
            item.precio_alquiler_dia = Math.round(item.precio_venta * 0.006); 
            item.precio_alquiler_hora = Math.round(item.precio_alquiler_dia / 8);
            item.oferta_alquiler = "Seguro Premium Incluido";
        }
        return item;
    });
    return { vehiculos: procesar(data.vehiculos), motos: procesar(data.motos) };
}

function cambiarCategoria(cat) {
    categoriaActual = cat;
    document.querySelectorAll('#catalogoTabs .nav-link').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    renderizarCatalogo();
}

function filtrarCatalogo() {
    renderizarCatalogo(document.getElementById('searchInput').value.toLowerCase());
}

function renderizarCatalogo(filtro = '') {
    const contenedor = document.getElementById('catalogoContenedor');
    contenedor.innerHTML = '';
    const items = catalogoCompleto[categoriaActual].filter(v => 
        v.marca.toLowerCase().includes(filtro) || v.modelo.toLowerCase().includes(filtro)
    );
    
    items.forEach(v => {
        contenedor.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card card-premium">
                    <div class="position-relative">
                        <img src="${v.imagen}" class="vehiculo-img" alt="${v.modelo}">
                        <span class="badge bg-danger position-absolute top-0 end-0 m-2">${v.oferta_alquiler || 'VIP'}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center mb-2">
                            ${v.logo ? `<img src="${v.logo}" class="logo-marca me-2">` : ''}
                            <h5 class="title-cyan mb-0">${v.marca} ${v.modelo}</h5>
                        </div>
                        <p class="text-white small mb-1"><i class="fas fa-microchip"></i> Motor: ${v.motor}</p>
                        <p class="text-white small mb-3"><i class="fas fa-info-circle"></i> ${v.caracteristicas}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between mb-2 border-bottom border-secondary pb-2">
                                <div><small class="text-secondary d-block">Compra</small><span class="price-gold">$${v.precio_venta.toLocaleString()}</span></div>
                                <div class="text-end"><small class="text-secondary d-block">Alquiler / Día</small><span class="price-orange">$${v.precio_alquiler_dia.toLocaleString()}</span></div>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-info flex-grow-1" onclick="abrirModalAlquiler(${v.codigo})">🔑 Alquilar</button>
                                <button class="btn btn-warning flex-grow-1" onclick="agregarAlCarrito(${v.codigo}, 'Venta')">🛒 Comprar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

function rellenarDatosVIP() {
    document.getElementById('checkoutName').value = "Angel Severino";
    document.getElementById('checkoutDoc').value = "24-SISN-8-037";
    document.getElementById('checkoutEmail').value = "danielseverinocabrera16@gmail.com";
    document.getElementById('checkoutLicense').value = "DO-8874125-VIP (Vigente)";
}

function buscarVehiculo(codigo) {
    return [...catalogoCompleto.vehiculos, ...catalogoCompleto.motos].find(v => v.codigo === codigo);
}

function abrirModalAlquiler(codigo) {
    vehiculoTemp = buscarVehiculo(codigo);
    document.getElementById('alquilerCodigo').value = codigo;
    new bootstrap.Modal(document.getElementById('modalAlquiler')).show();
}

function confirmarAlquiler() {
    const mod = document.getElementById('alquilerModalidad').value;
    const cant = parseInt(document.getElementById('alquilerCantidad').value);
    const fecha = document.getElementById('alquilerFecha').value;
    const precioBase = mod === 'Dias' ? vehiculoTemp.precio_alquiler_dia : vehiculoTemp.precio_alquiler_hora;
    
    agregarAlCarrito(vehiculoTemp.codigo, 'Alquiler', { modalidad: mod, cantidad: cant, fecha: fecha, precio: precioBase * cant });
    bootstrap.Modal.getInstance(document.getElementById('modalAlquiler')).hide();
}

function agregarAlCarrito(codigo, tipo, datosAlquiler = null) {
    const v = buscarVehiculo(codigo);
    const item = {
        id: Date.now(), codigo: v.codigo, marca: v.marca, modelo: v.modelo, imagen: v.imagen, tipoTran: tipo,
        precio: tipo === 'Venta' ? v.precio_venta : datosAlquiler.precio,
        detalle: tipo === 'Venta' ? 'Adquisición Definitiva' : `${datosAlquiler.cantidad} ${datosAlquiler.modalidad} (Desde ${datosAlquiler.fecha})`
    };
    carrito.push(item);
    actualizarCarritoUI();
    Swal.fire({ icon: 'success', title: 'Agregado', background: '#111622', color: '#fff', timer: 1000, showConfirmButton: false });
}

function actualizarCarritoUI() {
    document.getElementById('cartCount').innerText = carrito.length;
    const lista = document.getElementById('listaCarrito');
    let total = 0;
    lista.innerHTML = '';
    
    carrito.forEach(item => {
        total += item.precio;
        lista.innerHTML += `
            <li class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                <div>
                    <strong class="text-info">${item.tipoTran}:</strong> ${item.marca} ${item.modelo}<br>
                    <small class="text-secondary">${item.detalle}</small>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <span class="fw-bold text-warning">$${item.precio.toLocaleString()}</span>
                    <button class="btn btn-sm btn-danger" onclick="eliminarDelCarrito(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </li>`;
    });
    document.getElementById('totalCarrito').innerText = total.toLocaleString();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarCarritoUI();
}

function procesarPago() {
    if(carrito.length === 0) return Swal.fire('Carrito Vacío', '', 'warning');

    const clientName = document.getElementById('checkoutName').value;
    const clientId = document.getElementById('checkoutDoc').value;
    const orderId = `SEV-${Math.floor(Math.random() * 900000) + 100000}`;
    
    let tieneAlquiler = carrito.some(i => i.tipoTran === 'Alquiler');
    let tieneVenta = carrito.some(i => i.tipoTran === 'Venta');
    let tituloDoc = tieneAlquiler && tieneVenta ? "FACTURA DE VENTA Y CONTRATO DE ALQUILER" : (tieneAlquiler ? "CONTRATO DE ALQUILER Y ACUERDO DE RESPONSABILIDAD" : "FACTURA DE VENTA");

    const modalEl = document.getElementById('cartModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('overflow');

    let filasHtml = '';
    let total = 0;
    carrito.forEach((item, index) => {
        total += item.precio;
        let imgData = (window.PDF_THUMBNAILS && window.PDF_THUMBNAILS[item.imagen]) ? window.PDF_THUMBNAILS[item.imagen] : item.imagen;
        filasHtml += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;">${index + 1}</td>
                <td style="padding: 8px;"><img src="${imgData}" style="width: 45px; height: 30px; object-fit: cover; border-radius: 4px;"></td>
                <td style="padding: 8px;"><strong>${item.marca} ${item.modelo}</strong><br><small>Cod: ${item.codigo}</small></td>
                <td style="padding: 8px;">${item.tipoTran}</td>
                <td style="padding: 8px; font-size: 9px;">${item.detalle}</td>
                <td style="padding: 8px; text-align: right;">$${item.precio.toLocaleString()}</td>
            </tr>`;
    });

    let clausulasHtml = '';
    if (tieneAlquiler) {
        clausulasHtml = `
        <div style="margin-top: 15px; padding: 10px 14px; background: #fafafa !important; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 9.5px; color: #333333 !important; line-height: 1.45;">
            <h5 style="margin: 0 0 6px 0; font-size: 10.5px; font-weight: bold; color: #111111 !important; text-transform: uppercase;">Acuerdo de Responsabilidad y Términos de Alquiler:</h5>
            <p style="margin: 0 0 4px 0; color: #333333 !important;"><strong style="color: #111111 !important;">1. Custodia del Bien:</strong> El arrendatario operará la unidad bajo las leyes de tránsito vigentes.</p>
            <p style="margin: 0 0 4px 0; color: #333333 !important;"><strong style="color: #111111 !important;">2. Cobertura & Deducible:</strong> Póliza de seguro con deducible del 10% en caso de colisión.</p>
            <p style="margin: 0 0 4px 0; color: #333333 !important;"><strong style="color: #111111 !important;">3. Política de Combustible:</strong> La unidad se entrega con tanque lleno y debe ser devuelta igual.</p>
        </div>
        <table style="width: 100%; margin-top: 30px; font-size: 10px; text-align: center;" cellpadding="0" cellspacing="0">
            <tr>
                <td style="width: 45%; vertical-align: top;"><div style="border-top: 1px solid #333; padding-top: 6px; margin: 0 20px;"><strong style="color: #111111 !important;">SEVERINO ELITE MOTORS</strong><br><span style="color: #555 !important;">Firma Autorizada</span></div></td>
                <td style="width: 10%;"></td>
                <td style="width: 45%; vertical-align: top;"><div style="border-top: 1px solid #333; padding-top: 6px; margin: 0 20px;"><strong style="color: #111111 !important;">${clientName}</strong><br><span style="color: #555 !important;">Doc ID: ${clientId}</span></div></td>
            </tr>
        </table>`;
    } else {
        clausulasHtml = `
        <div style="margin-top: 20px; padding: 10px; background: #fdfdfd; border-left: 3px solid #2e7d32; font-size: 9.5px; color: #444;">
            <strong style="color: #111 !important;">Garantía de Satisfacción:</strong> Unidad vendida con garantía certificada de 3 años o 60,000 km, traspaso legal garantizado y asistencia vial 24/7.
        </div>`;
    }

    // Logo en el PDF basado en tu archivo de assets
    let logoPdf = (window.PDF_THUMBNAILS && window.PDF_THUMBNAILS['assets/logo_marca_severino']) ? window.PDF_THUMBNAILS['assets/logo_marca_severino'] : '';

    const htmlStringDefinitivo = `
    <div class="pdf-doc-root" style="padding: 30px; font-family: sans-serif; background-color: #ffffff; color: #111111;">
        <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px;">
            ${logoPdf ? `<img src="${logoPdf}" style="height: 50px; margin-bottom: 8px;">` : ''}
            <h2 style="margin: 0; font-size: 22px; font-weight: 900;">SEVERINO ELITE MOTORS</h2>
            <p style="margin: 5px 0; font-size: 11px; color: #444;">Santo Domingo, Rep. Dom. | contacto@severinoelitemotors.com</p>
            <div style="background: #111; color: #fff; display: inline-block; padding: 5px 15px; border-radius: 4px; font-weight: bold; font-size: 12px; margin-top: 10px;">${tituloDoc}</div>
        </div>
        
        <table style="width: 100%; font-size: 11px; margin-bottom: 20px; background: #f8f9fa; border: 1px solid #eee; padding: 10px; border-radius: 6px;">
            <tr>
                <td style="width: 50%; color: #333;"><strong>CLIENTE:</strong> ${clientName}<br><strong>ID / CÉDULA:</strong> ${clientId}</td>
                <td style="width: 50%; text-align: right; color: #333;"><strong>NO. DOCUMENTO:</strong> ${orderId}<br><strong style="color: #2e7d32;">Procesado & Confirmado</strong></td>
            </tr>
        </table>

        <table style="width: 100%; font-size: 10px; text-align: left; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #111; color: #fff;">
                    <th style="padding: 8px; color: #fff !important;">#</th><th style="padding: 8px; color: #fff !important;">Foto</th><th style="padding: 8px; color: #fff !important;">Vehículo</th><th style="padding: 8px; color: #fff !important;">Tipo</th><th style="padding: 8px; color: #fff !important;">Detalle</th><th style="padding: 8px; text-align: right; color: #fff !important;">Subtotal</th>
                </tr>
            </thead>
            <tbody>${filasHtml}</tbody>
        </table>

        <div style="text-align: right; font-size: 16px; margin-bottom: 30px; border-top: 2px solid #111; padding-top: 10px;">
            <strong style="color: #111 !important;">TOTAL GENERAL: $${total.toLocaleString()} USD</strong>
        </div>

        ${clausulasHtml}

        <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center; font-size: 9px; color: #777;">
            Documento generado automáticamente por Severino Elite Motors E-Commerce & Alquiler<br>
            <strong>Arquitectura de Software por Angel Severino (24-SISN-8-037)</strong>
        </div>
    </div>`;

    const opt = {
        margin: 5,
        filename: `SEV_${orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(() => {
        html2pdf().set(opt).from(htmlStringDefinitivo).save().then(() => {
            carrito = [];
            actualizarCarritoUI();
            Swal.fire({ icon: 'success', title: '¡Transacción Exitosa!', text: 'Documento legal generado y descargado.', background: '#111622', color: '#fff', confirmButtonColor: '#00d2ff' });
        });
    }, 400);
}