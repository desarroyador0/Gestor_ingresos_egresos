 // --- ELEMENTOS DEL DOM ---
        const form = document.getElementById('transactionForm');
        const sectorInput = document.getElementById('sector');
        const descriptionInput = document.getElementById('description');
        const amountInput = document.getElementById('amount');
        const tableBody = document.getElementById('transactionTableBody');
        const emptyRow = document.getElementById('empty-row');
        const totalIngresosEl = document.getElementById('totalIngresos');
        const totalEgresosEl = document.getElementById('totalEgresos');
        const balanceNetoEl = document.getElementById('balanceNeto');
        const balanceContainer = document.getElementById('balanceContainer');
        const exportButton = document.getElementById('exportButton');
        
        // --- ESTADO DE LA APLICACIÓN ---
        // Usamos localStorage para que los datos persistan al recargar la página
        let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

        // --- FUNCIONES ---

        /**
         * Formatea un número como moneda local (ej: $1,234.56)
         * @param {number} amount - El monto a formatear.
         * @returns {string} El monto formateado.
         */
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
        };
        
        /**
         * Actualiza el resumen de totales (ingresos, egresos y balance).
         */
        const updateSummary = () => {
            const ingresos = transactions
                .filter(t => t.type === 'ingreso')
                .reduce((sum, t) => sum + t.amount, 0);

            const egresos = transactions
                .filter(t => t.type === 'egreso')
                .reduce((sum, t) => sum + t.amount, 0);

            const balance = ingresos - egresos;

            totalIngresosEl.textContent = formatCurrency(ingresos);
            totalEgresosEl.textContent = formatCurrency(egresos);
            balanceNetoEl.textContent = formatCurrency(balance);
            
            // Cambia el color del balance según sea positivo, negativo o cero
            balanceContainer.classList.remove('bg-green-200', 'bg-red-200', 'bg-gray-200');
            balanceNetoEl.classList.remove('text-green-700', 'text-red-700', 'text-gray-900');

            if (balance > 0) {
                balanceContainer.classList.add('bg-green-200');
                balanceNetoEl.classList.add('text-green-700');
            } else if (balance < 0) {
                balanceContainer.classList.add('bg-red-200');
                balanceNetoEl.classList.add('text-red-700');
            } else {
                 balanceContainer.classList.add('bg-gray-200');
                 balanceNetoEl.classList.add('text-gray-900');
            }
        };
        
        /**
         * Elimina una transacción por su ID.
         * @param {number} id - El ID de la transacción a eliminar.
         */
        const deleteTransaction = (id) => {
            transactions = transactions.filter(t => t.id !== id);
            saveAndRender();
        };

        /**
         * Renderiza la tabla de transacciones en el DOM.
         */
        const renderTransactions = () => {
            tableBody.innerHTML = ''; // Limpia la tabla
            
            if (transactions.length === 0) {
                tableBody.appendChild(emptyRow); // Muestra la fila de "sin transacciones"
                return;
            }

            // Ordena las transacciones por fecha, de la más reciente a la más antigua
            const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedTransactions.forEach(t => {
                const row = document.createElement('tr');
                row.className = 'bg-white border-b hover:bg-gray-50 fade-in';

                const isIngreso = t.type === 'ingreso';
                const typeClass = isIngreso ? 'text-green-600' : 'text-red-600';
                const typeBadge = isIngreso ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                
                row.innerHTML = `
                    <td class="px-6 py-4 text-gray-500">${new Date(t.date).toLocaleDateString('es-ES')}</td>
                    <td class="px-6 py-4 font-medium text-gray-900">${t.sector}</td>
                    <td class="px-6 py-4">${t.description}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${typeBadge}">
                            ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right font-medium ${typeClass}">${formatCurrency(t.amount)}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="deleteTransaction(${t.id})" class="text-red-500 hover:text-red-700 font-medium transition">Eliminar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        };

        /**
         * Guarda las transacciones en localStorage y actualiza la UI.
         */
        const saveAndRender = () => {
            localStorage.setItem('transactions', JSON.stringify(transactions));
            renderTransactions();
            updateSummary();
        };

        /**
         * Maneja el envío del formulario para agregar una nueva transacción.
         */
        const handleFormSubmit = (e) => {
            e.preventDefault();

            const sector = sectorInput.value.trim();
            const description = descriptionInput.value.trim();
            const amount = parseFloat(amountInput.value);
            const type = document.querySelector('input[name="type"]:checked').value;

            if (!sector || !description || isNaN(amount) || amount <= 0) {
                // Se podría agregar un mensaje de error más visible aquí.
                alert('Por favor, complete todos los campos correctamente.');
                return;
            }

            const newTransaction = {
                id: Date.now(), // ID único basado en el timestamp
                sector,
                description,
                amount,
                type,
                date: new Date().toISOString()
            };

            transactions.push(newTransaction);
            saveAndRender();

            form.reset();
            sectorInput.focus();
        };
        
        /**
         * Exporta los datos de las transacciones a un archivo Excel.
         */
        const exportToExcel = () => {
            if (transactions.length === 0) {
                alert("No hay datos para exportar.");
                return;
            }

            // Prepara los datos para la hoja de cálculo
            const dataToExport = transactions.map(t => ({
                'Fecha': new Date(t.date).toLocaleDateString('es-ES'),
                'Sector': t.sector,
                'Descripción': t.description,
                'Tipo': t.type,
                'Monto': t.amount
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

            // Ajusta el ancho de las columnas
            worksheet['!cols'] = [
                { wch: 12 }, // Fecha
                { wch: 20 }, // Sector
                { wch: 40 }, // Descripción
                { wch: 10 }, // Tipo
                { wch: 15 }  // Monto
            ];
            
            // Dispara la descarga del archivo
            XLSX.writeFile(workbook, 'Reporte_Financiero.xlsx');
        };


        // --- INICIALIZACIÓN ---
        form.addEventListener('submit', handleFormSubmit);
        exportButton.addEventListener('click', exportToExcel);
        
        // Carga inicial de datos al abrir la página
        document.addEventListener('DOMContentLoaded', () => {
            saveAndRender();
        });

