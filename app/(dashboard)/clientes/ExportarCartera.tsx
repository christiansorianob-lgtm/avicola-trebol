"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { obtenerDatosExportacionExcel } from "@/app/actions";
import { ETIQUETAS_CARTON, TipoCartonType } from "@/lib/config";

export default function ExportarCartera() {
  const [loading, setLoading] = useState(false);

  const exportExcel = async () => {
    setLoading(true);
    try {
      const res = await obtenerDatosExportacionExcel();
      if (!res.success || !res.clientes) {
        alert("Error al obtener los datos");
        setLoading(false);
        return;
      }

      const clientes = res.clientes;

      // 1. Hoja de Resumen de Clientes
      const dataResumen = clientes.map((c: any) => {
        let saldoPesos = 0;
        let ultimaFechaStr = "Sin movimientos";
        
        c.movimientos.forEach((m: any) => {
          if (m.tipo === "ENTREGA") {
            saldoPesos += (m.cartones || 0) * (m.precioUnit || 0);
          } else if (m.tipo === "PAGO") {
            saldoPesos -= (m.monto || 0);
          }
        });

        if (c.movimientos.length > 0) {
          ultimaFechaStr = format(new Date(c.movimientos[0].fecha), "dd/MM/yyyy HH:mm");
        }

        return {
          "Nombre de Cliente": c.nombre,
          "Teléfono": c.telefono || "",
          "Dirección": c.direccion || "",
          "Saldo Pendiente ($)": Math.max(0, saldoPesos),
          "Última Actividad": ultimaFechaStr,
        };
      });

      // 2. Hoja de Movimientos Detallados
      const dataMovimientos: any[] = [];
      
      clientes.forEach((c: any) => {
        let saldoAcumulado = 0;
        // Calcular saldos acumulados de antiguo a reciente
        const movsAsc = [...c.movimientos].reverse().map((m: any) => {
          if (m.tipo === "ENTREGA") {
            saldoAcumulado += (m.cartones || 0) * (m.precioUnit || 0);
          } else {
            saldoAcumulado -= (m.monto || 0);
          }
          return { ...m, saldoAcumulado };
        });

        // Agregarlos al reporte
        movsAsc.forEach((m: any) => {
          let detalle = m.tipo === "ENTREGA" 
            ? `${m.cartones} cartones ${m.tipoCarton ? ETIQUETAS_CARTON[m.tipoCarton as TipoCartonType] : ''}`
            : "Abono/Pago";
          
          if (m.notas) detalle += ` - ${m.notas}`;

          let valorMovimiento = m.tipo === "ENTREGA"
            ? (m.cartones || 0) * (m.precioUnit || 0)
            : -(m.monto || 0);

          dataMovimientos.push({
            "Cliente": c.nombre,
            "Fecha": format(new Date(m.fecha), "dd/MM/yyyy HH:mm"),
            "Tipo": m.tipo,
            "Detalle": detalle,
            "Valor ($)": valorMovimiento,
            "Saldo Acumulado ($)": Math.max(0, m.saldoAcumulado)
          });
        });
      });

      // Crear archivo Excel
      const wb = XLSX.utils.book_new();
      
      // Añadir Resumen
      const wsResumen = XLSX.utils.json_to_sheet(dataResumen);
      wsResumen["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Clientes");

      // Añadir Movimientos
      const wsMovimientos = XLSX.utils.json_to_sheet(dataMovimientos);
      wsMovimientos["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsMovimientos, "Historial Movimientos");

      XLSX.writeFile(wb, `Reporte_Cartera_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("Error al generar Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full sm:w-auto">
      <Button variant="outline" size="sm" onClick={exportExcel} disabled={loading} className="flex-1 sm:flex-none">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />}
        Exportar Reporte Excel
      </Button>
    </div>
  );
}
