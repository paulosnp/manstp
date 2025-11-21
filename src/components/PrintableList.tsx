import React, { forwardRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PrintableListProps {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
}

export const PrintableList = forwardRef<HTMLDivElement, PrintableListProps>(
  ({ title, subtitle, headers, data, renderRow }, ref) => {
    return (
      <div ref={ref} className="print-content">
        <style>
          {`
            @media print {
              @page {
                size: A4 landscape;
                margin: 15mm;
              }
              
              body * {
                visibility: hidden;
              }
              
              .print-content,
              .print-content * {
                visibility: visible;
              }
              
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
              }
              
              .no-print {
                display: none !important;
              }
              
              .print-header {
                margin-bottom: 20px;
                text-align: center;
              }
              
              .print-title {
                font-size: 20px;
                font-weight: bold;
                color: black;
                margin-bottom: 5px;
              }
              
              .print-subtitle {
                font-size: 14px;
                color: #666;
                margin-bottom: 15px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                color: black;
              }
              
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              
              img {
                max-width: 40px;
                max-height: 50px;
              }
            }
          `}
        </style>
        
        <div className="print-header">
          <h1 className="print-title text-2xl font-bold mb-2">{title}</h1>
          {subtitle && <p className="print-subtitle text-muted-foreground">{subtitle}</p>}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => renderRow(item, index))}
          </TableBody>
        </Table>
      </div>
    );
  }
);

PrintableList.displayName = "PrintableList";
