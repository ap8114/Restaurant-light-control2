/**
 * Universal Printer Service for Restaurant POS
 *
 * Supports multiple printing methods with automatic fallback:
 * 1. Network ESC/POS Printers (Epson, Star, Bixolon, etc.)
 * 2. Web Print API (Browser native)
 * 3. PDF Generation (jsPDF - already installed)
 * 4. Email Receipt
 *
 * Installation required:
 * npm install node-thermal-printer escpos escpos-network
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';

class PrinterService {
    constructor() {
        this.printers = new Map();
        this.defaultPrinter = null;
        this.fallbackChain = ['network', 'webprint', 'pdf', 'email'];
    }

    /**
     * Initialize printer service
     */
    async initialize() {
        // Load saved printers from localStorage
        const savedPrinters = localStorage.getItem('printers');
        if (savedPrinters) {
            const printers = JSON.parse(savedPrinters);
            printers.forEach(printer => {
                this.printers.set(printer.id, printer);
            });
        }

        // Check for Web Print API support
        if ('print' in window) {
            console.log('Web Print API available');
        }
    }

    /**
     * Add a network printer
     * @param {Object} printerConfig - Printer configuration
     * @returns {Object} Status
     */
    addNetworkPrinter(printerConfig) {
        const {
            id,
            name,
            type, // 'kitchen', 'bar', 'receipt'
            ip,
            port = 9100,
            model = 'ESC/POS'
        } = printerConfig;

        const printer = {
            id,
            name,
            type,
            connection: 'network',
            ip,
            port,
            model,
            status: 'configured',
            addedAt: new Date().toISOString()
        };

        this.printers.set(id, printer);
        this.savePrinters();

        return {
            success: true,
            message: 'Printer added successfully',
            printer
        };
    }

    /**
     * Test print to verify printer connection
     * @param {string} printerId - Printer ID
     * @returns {Promise<Object>} Test result
     */
    async testPrint(printerId) {
        const printer = this.printers.get(printerId);

        if (!printer) {
            return {
                success: false,
                message: 'Printer not found'
            };
        }

        const testReceipt = {
            header: 'TEST PRINT',
            items: [
                { name: 'Test Item 1', quantity: 1, price: 10.00 },
                { name: 'Test Item 2', quantity: 2, price: 5.00 }
            ],
            total: 20.00,
            timestamp: new Date().toISOString()
        };

        return await this.printReceipt(printerId, testReceipt);
    }

    /**
     * Print a receipt with automatic fallback
     * @param {string} printerId - Printer ID
     * @param {Object} receiptData - Receipt data
     * @returns {Promise<Object>} Print result
     */
    async printReceipt(printerId, receiptData) {
        const printer = this.printers.get(printerId);

        if (!printer) {
            toast.error('Printer not found');
            return { success: false, message: 'Printer not found' };
        }

        // Try each method in the fallback chain
        for (const method of this.fallbackChain) {
            try {
                let result;

                switch (method) {
                    case 'network':
                        result = await this.printViaNetwork(printer, receiptData);
                        break;
                    case 'webprint':
                        result = await this.printViaWebAPI(receiptData);
                        break;
                    case 'pdf':
                        result = await this.printViaPDF(receiptData);
                        break;
                    case 'email':
                        result = await this.printViaEmail(receiptData);
                        break;
                }

                if (result.success) {
                    return result;
                }
            } catch (error) {
                console.error(`Print method ${method} failed:`, error);
                // Continue to next method
            }
        }

        // All methods failed
        toast.error('All printing methods failed. Receipt saved locally.');
        this.saveReceiptLocally(receiptData);

        return {
            success: false,
            message: 'All printing methods failed',
            savedLocally: true
        };
    }

    /**
     * Print via network ESC/POS printer
     * @param {Object} printer - Printer configuration
     * @param {Object} data - Receipt data
     * @returns {Promise<Object>} Result
     */
    async printViaNetwork(printer, data) {
        try {
            // Generate ESC/POS commands
            const commands = this.generateESCPOS(data);

            // Send to printer via network
            const response = await fetch(`http://${printer.ip}:${printer.port}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                body: commands
            });

            if (response.ok) {
                toast.success(`Printed to ${printer.name}`);
                return {
                    success: true,
                    method: 'network',
                    printer: printer.name
                };
            }

            throw new Error('Network print failed');
        } catch (error) {
            console.error('Network print error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate ESC/POS commands for thermal printer
     * @param {Object} data - Receipt data
     * @returns {Uint8Array} ESC/POS commands
     */
    generateESCPOS(data) {
        const commands = [];

        // ESC/POS command codes
        const ESC = 0x1B;
        const GS = 0x1D;

        // Initialize printer
        commands.push(ESC, 0x40);

        // Set alignment to center
        commands.push(ESC, 0x61, 0x01);

        // Print header (bold, double size)
        commands.push(ESC, 0x21, 0x30); // Double height + width
        this.addText(commands, data.header || 'RECEIPT');
        this.addText(commands, '\n\n');

        // Reset to normal
        commands.push(ESC, 0x21, 0x00);

        // Set alignment to left
        commands.push(ESC, 0x61, 0x00);

        // Print timestamp
        const date = new Date(data.timestamp);
        this.addText(commands, `Date: ${date.toLocaleDateString()}\n`);
        this.addText(commands, `Time: ${date.toLocaleTimeString()}\n`);
        this.addText(commands, '--------------------------------\n');

        // Print items
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const line = `${item.quantity}x ${item.name}`;
                const price = `$${item.price.toFixed(2)}`;
                const spaces = 32 - line.length - price.length;
                this.addText(commands, line + ' '.repeat(Math.max(0, spaces)) + price + '\n');

                // Add special instructions if any
                if (item.special_instructions) {
                    this.addText(commands, `  Note: ${item.special_instructions}\n`);
                }
            });
        }

        // Print separator
        this.addText(commands, '--------------------------------\n');

        // Print totals
        if (data.subtotal) {
            this.addText(commands, `Subtotal:        $${data.subtotal.toFixed(2)}\n`);
        }
        if (data.tax) {
            this.addText(commands, `Tax:             $${data.tax.toFixed(2)}\n`);
        }
        if (data.discount) {
            this.addText(commands, `Discount:       -$${data.discount.toFixed(2)}\n`);
        }

        // Print total (bold, double height)
        commands.push(ESC, 0x21, 0x10); // Double height
        this.addText(commands, `TOTAL:           $${data.total.toFixed(2)}\n`);
        commands.push(ESC, 0x21, 0x00); // Reset

        // Print footer
        this.addText(commands, '\n');
        commands.push(ESC, 0x61, 0x01); // Center align
        this.addText(commands, 'Thank You!\n');
        this.addText(commands, data.footer || '');

        // Feed paper and cut
        this.addText(commands, '\n\n\n');
        commands.push(GS, 0x56, 0x41, 0x03); // Partial cut

        return new Uint8Array(commands);
    }

    /**
     * Add text to ESC/POS command array
     * @param {Array} commands - Command array
     * @param {string} text - Text to add
     */
    addText(commands, text) {
        for (let i = 0; i < text.length; i++) {
            commands.push(text.charCodeAt(i));
        }
    }

    /**
     * Print via browser's native print API
     * @param {Object} data - Receipt data
     * @returns {Promise<Object>} Result
     */
    async printViaWebAPI(data) {
        try {
            // Create a hidden iframe with the receipt
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(this.generateHTML(data));
            doc.close();

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Print
            iframe.contentWindow.print();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);

            toast.info('Print dialog opened');
            return {
                success: true,
                method: 'webprint'
            };
        } catch (error) {
            console.error('Web print error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate HTML for receipt
     * @param {Object} data - Receipt data
     * @returns {string} HTML
     */
    generateHTML(data) {
        const date = new Date(data.timestamp);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    @media print {
                        @page { margin: 0; }
                        body { margin: 1cm; }
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12pt;
                        max-width: 300px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        font-weight: bold;
                        font-size: 18pt;
                        margin-bottom: 10px;
                    }
                    .section {
                        margin: 10px 0;
                    }
                    .item-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .separator {
                        border-top: 1px dashed #000;
                        margin: 10px 0;
                    }
                    .total {
                        font-weight: bold;
                        font-size: 14pt;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="header">${data.header || 'RECEIPT'}</div>

                <div class="section">
                    <div>Date: ${date.toLocaleDateString()}</div>
                    <div>Time: ${date.toLocaleTimeString()}</div>
                    ${data.orderNumber ? `<div>Order #: ${data.orderNumber}</div>` : ''}
                    ${data.table ? `<div>Table: ${data.table}</div>` : ''}
                </div>

                <div class="separator"></div>

                <div class="section">
                    ${data.items.map(item => `
                        <div class="item-row">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>$${item.price.toFixed(2)}</span>
                        </div>
                        ${item.special_instructions ? `<div style="margin-left: 20px; font-size: 10pt;">Note: ${item.special_instructions}</div>` : ''}
                    `).join('')}
                </div>

                <div class="separator"></div>

                <div class="section">
                    ${data.subtotal ? `<div class="item-row"><span>Subtotal</span><span>$${data.subtotal.toFixed(2)}</span></div>` : ''}
                    ${data.tax ? `<div class="item-row"><span>Tax</span><span>$${data.tax.toFixed(2)}</span></div>` : ''}
                    ${data.discount ? `<div class="item-row"><span>Discount</span><span>-$${data.discount.toFixed(2)}</span></div>` : ''}
                    <div class="item-row total">
                        <span>TOTAL</span>
                        <span>$${data.total.toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank You!</p>
                    ${data.footer ? `<p>${data.footer}</p>` : ''}
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Print via PDF generation (using jsPDF - already installed)
     * @param {Object} data - Receipt data
     * @returns {Promise<Object>} Result
     */
    async printViaPDF(data) {
        try {
            const doc = new jsPDF({
                format: [80, 200], // 80mm wide thermal paper
                unit: 'mm'
            });

            const date = new Date(data.timestamp);
            let y = 10;

            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(data.header || 'RECEIPT', 40, y, { align: 'center' });
            y += 10;

            // Date/Time
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date: ${date.toLocaleDateString()}`, 5, y);
            y += 5;
            doc.text(`Time: ${date.toLocaleTimeString()}`, 5, y);
            y += 10;

            // Items table
            const items = data.items.map(item => [
                `${item.quantity}x ${item.name}`,
                `$${item.price.toFixed(2)}`
            ]);

            doc.autoTable({
                startY: y,
                head: [['Item', 'Price']],
                body: items,
                theme: 'plain',
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 20, halign: 'right' }
                }
            });

            y = doc.lastAutoTable.finalY + 10;

            // Totals
            if (data.subtotal) {
                doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, 5, y);
                y += 5;
            }
            if (data.tax) {
                doc.text(`Tax: $${data.tax.toFixed(2)}`, 5, y);
                y += 5;
            }
            if (data.discount) {
                doc.text(`Discount: -$${data.discount.toFixed(2)}`, 5, y);
                y += 5;
            }

            // Total
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL: $${data.total.toFixed(2)}`, 5, y);

            // Footer
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Thank You!', 40, y, { align: 'center' });

            // Save PDF
            const filename = `receipt_${Date.now()}.pdf`;
            doc.save(filename);

            toast.success('Receipt downloaded as PDF');
            return {
                success: true,
                method: 'pdf',
                filename
            };
        } catch (error) {
            console.error('PDF generation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send receipt via email
     * @param {Object} data - Receipt data
     * @returns {Promise<Object>} Result
     */
    async printViaEmail(data) {
        try {
            // This would typically call a backend API to send email
            const response = await axiosInstance.post('/email/receipt', {
                to: data.customerEmail || 'customer@example.com',
                receipt: data
            });

            if (response.data.success) {
                toast.info('Receipt sent via email');
                return {
                    success: true,
                    method: 'email'
                };
            }

            throw new Error('Email send failed');
        } catch (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save receipt locally as backup
     * @param {Object} data - Receipt data
     */
    saveReceiptLocally(data) {
        const receipts = JSON.parse(localStorage.getItem('saved_receipts') || '[]');
        receipts.push({
            ...data,
            savedAt: new Date().toISOString()
        });
        localStorage.setItem('saved_receipts', JSON.stringify(receipts));
    }

    /**
     * Save printers to localStorage
     */
    savePrinters() {
        const printers = Array.from(this.printers.values());
        localStorage.setItem('printers', JSON.stringify(printers));
    }

    /**
     * Get all configured printers
     * @returns {Array} List of printers
     */
    getAllPrinters() {
        return Array.from(this.printers.values());
    }

    /**
     * Remove a printer
     * @param {string} printerId - Printer ID
     * @returns {boolean} Success status
     */
    removePrinter(printerId) {
        const result = this.printers.delete(printerId);
        if (result) {
            this.savePrinters();
        }
        return result;
    }

    /**
     * Discover network printers
     * @param {string} networkPrefix - Network prefix (e.g., '192.168.1')
     * @returns {Promise<Array>} List of discovered printers
     */
    async discoverPrinters(networkPrefix = '192.168.1') {
        const discovered = [];
        const commonPorts = [9100, 515, 631]; // Raw, LPD, IPP

        toast.info('Scanning for printers...');

        for (let i = 1; i <= 255; i++) {
            const ip = `${networkPrefix}.${i}`;

            for (const port of commonPorts) {
                try {
                    // Try to connect
                    const response = await fetch(`http://${ip}:${port}`, {
                        method: 'GET',
                        mode: 'no-cors',
                        signal: AbortSignal.timeout(500)
                    });

                    discovered.push({
                        ip,
                        port,
                        status: 'found'
                    });
                } catch (error) {
                    // Device not found or timeout
                }
            }

            if (i % 50 === 0) {
                console.log(`Scanned ${i}/255 addresses...`);
            }
        }

        toast.success(`Found ${discovered.length} potential printers`);
        return discovered;
    }
}

// Export singleton instance
const printerService = new PrinterService();
export default printerService;
