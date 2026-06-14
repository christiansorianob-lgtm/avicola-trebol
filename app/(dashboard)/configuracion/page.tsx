"use client";

import { useState } from "react";
import { Download, Database, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConfiguracionPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'excel' | 'csv', table: string = 'all') => {
    setDownloading(`${format}-${table}`);
    try {
      const url = `/api/backup?format=${format}&table=${table}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Error al descargar');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      let filename = 'backup';
      if (format === 'excel') filename = 'backup_avicola_trebol.xlsx';
      else filename = `${table}.csv`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al generar el backup.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Configuración</h1>
        <p className="text-slate-400">Administra las opciones del sistema y la seguridad de tu información.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Database className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Respaldo de Datos</h2>
              <p className="text-sm text-slate-400">Descarga la información de tu base de datos</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleDownload('excel', 'all')}
              disabled={downloading !== null}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group",
                downloading === 'excel-all' 
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="block font-medium">Backup Completo (Excel)</span>
                  <span className="text-xs opacity-70">Todas las tablas en un solo archivo con pestañas</span>
                </div>
              </div>
              {downloading === 'excel-all' ? (
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-y-1 transition-all" />
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2 text-slate-500">O descargar tablas individuales en CSV</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'clientes', name: 'Clientes' },
                { id: 'movimientos', name: 'Movimientos' },
                { id: 'gastos', name: 'Gastos' },
                { id: 'despachos', name: 'Despachos' },
              ].map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleDownload('csv', table.id)}
                  disabled={downloading !== null}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group",
                    downloading === `csv-${table.id}`
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{table.name}</span>
                  </div>
                  {downloading === `csv-${table.id}` ? (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200/70 leading-relaxed">
              Es recomendable realizar un Backup Completo periódicamente. El archivo Excel contendrá múltiples pestañas, una por cada tabla de tu sistema, asegurando la integridad de la información.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
