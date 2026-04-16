# MMC Frota — Instruções de Setup

## 1. Apps Script — Atualizar o código

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1i2pmMbErH8xEjYwGt-_ls0ZL0GksqINku2J99VGq2a0
2. Menu: Extensões → Apps Script
3. NO FINAL do código existente (NÃO apague nada), cole o conteúdo do arquivo `APPS_SCRIPT_FROTA.js`
4. IMPORTANTE: Substitua a função `processRequest` existente pela versão nova (está comentada no final do arquivo)
5. Clique em "Implantar" → "Gerenciar implantações"
6. Clique em "Editar" (lápis) → Em "Versão" selecione "Nova versão"
7. Clique "Implantar"

## 2. Criar as abas automaticamente

Após atualizar o Apps Script, acesse:
```
https://script.google.com/macros/s/AKfycbzUBhDAvIwVzRWpCZyI_2zRDKvB0VCs0gdosIen6l0_2vqaCUOgjsr97CVoU5ilflLWAg/exec?payload={"action":"frota_setup"}&_=1
```
Isso cria as 4 abas automaticamente: Frota_Veiculos, Frota_Operadores, Frota_Escala, Frota_Historico

## 3. GitHub — Criar repositório

1. Crie um novo repositório no GitHub (ex: `MMC-Frota`)
2. Faça upload de todos os arquivos da pasta `frota/`:
   - index.html
   - manifest.json
   - sw.js
   - vercel.json
   - icon-192.png
   - icon-512.png
   - apple-touch-icon.png

## 4. Vercel — Deploy

1. Acesse vercel.com e conecte o repositório
2. Deploy automático
3. O painel estará acessível no domínio do Vercel

## Senhas

- Painel de Máquinas: `mmc2026`
- Painel de Frota: `frota2026`

## Abas na Planilha

O painel de frota usa 4 abas separadas:
- `Frota_Veiculos`: id, tipo, placa, modelo, apelido, status, observacoes
- `Frota_Operadores`: id, nome, habilitacoes, telefone, status, observacoes
- `Frota_Escala`: id, data, veiculo_id, veiculo_nome, operador_id, operador_nome, servico, destino, cliente, maquina, prioridade, status, hora_saida, hora_retorno, observacoes
- `Frota_Historico`: timestamp, data, hora, tipo, descricao

Nenhuma aba do painel de máquinas é alterada.
