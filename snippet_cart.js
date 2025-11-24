
document.addEventListener('DOMContentLoaded', function() {
  
  // ─────────────────────────────────────────────────────────────
  // FUNZIONI DI UTILITÀ
  // ─────────────────────────────────────────────────────────────

  // Mostra o nasconde i form di fatturazione
  function toggleInvoiceForm(show) {
    const invoiceDetailsForms = document.querySelectorAll('#invoice-details-form');
    invoiceDetailsForms.forEach((form) => {
      form.style.display = show ? 'grid' : 'none';
    });
  }

  // Aggiorna gli attributi del carrello su Shopify
  function updateCartAttributes(needInvoice) {
    const companyNames = document.querySelectorAll('#company-name');
    const vatNumbers   = document.querySelectorAll('#vat-number');
    const sdiCodes     = document.querySelectorAll('#sdi-code');

    // Prendiamo il valore del primo input
    const companyName = companyNames[0]?.value.trim() || '';
    const vatNumber   = vatNumbers[0]?.value.trim()   || '';
    const sdiCode     = sdiCodes[0]?.value.trim()     || '';

    const attributes = {
      need_invoice: needInvoice
    };
  
    if (needInvoice) {
      attributes.company_name = companyName;
      attributes.vat_number   = vatNumber;
      attributes.sdi_code     = sdiCode;
    }
  
    fetch(`${routes.cart_update_url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributes })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Attributi aggiornati con successo:', data);
    })
    .catch(error => {
      console.error('Errore durante l’aggiornamento degli attributi:', error);
    });
  }

  // Sincronizza il valore di un input con tutti gli altri input che hanno lo stesso ID
  // (ovvero #company-name, #vat-number, #sdi-code presenti nel DOM).
  // Poi richiama la validazione.
  function syncFields(sourceField) {
    const targetFields = document.querySelectorAll('#' + sourceField.id);
    
    targetFields.forEach(field => {
      if (field !== sourceField) {
        field.value = sourceField.value;
      }
    });

    validateInvoiceFields();
  }

  // Verifica se i campi sono compilati quando la checkbox fattura è spuntata,
  // e abilita/disabilita i pulsanti Checkout di conseguenza.
  function validateInvoiceFields() {
    const checkboxes      = document.querySelectorAll('#invoice-checkbox');
    const companyNames    = document.querySelectorAll('#company-name');
    const vatNumbers      = document.querySelectorAll('#vat-number');
    const sdiCodes        = document.querySelectorAll('#sdi-code');
    const checkoutButtons = document.querySelectorAll('#CartDrawer-Checkout');
    
    // Controlla se almeno una delle checkbox "need_invoice" è spuntata
    const isChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    
    let isValid = true;
    if (isChecked) {
      // Usa 'every' per pretendere che TUTTI i campi siano pieni
      const allCompanyNamesFilled = Array.from(companyNames).every(inp => inp.value.trim() !== '');
      const allVatNumbersFilled   = Array.from(vatNumbers).every(inp => inp.value.trim() !== '');
      const allSdiCodesFilled     = Array.from(sdiCodes).every(inp => inp.value.trim() !== '');
      isValid = allCompanyNamesFilled && allVatNumbersFilled && allSdiCodesFilled;
    }
    
    // Abilita/disabilita i pulsanti Checkout
    checkoutButtons.forEach(button => {
      if (isChecked && !isValid) {
        button.disabled = true;
        button.classList.add('disabled');
      } else {
        button.disabled = false;
        button.classList.remove('disabled');
      }
    });
  }

  // Sincronizza lo stato di *tutte* le checkbox "need_invoice",
  // mostra/nasconde i form e aggiorna il carrello
  function syncCheckboxes(checked) {
    const checkboxes = document.querySelectorAll('#invoice-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = checked;
    });
    
    toggleInvoiceForm(checked);
    validateInvoiceFields();
    updateCartAttributes(checked);
  }

  // Ripristina lo stato (ad esempio dopo un refresh del carrello)
  function restoreInvoiceCheckboxState() {
    const checkboxes = document.querySelectorAll('#invoice-checkbox');
    const isChecked  = Array.from(checkboxes).some(checkbox => checkbox.checked);

    toggleInvoiceForm(isChecked);
    validateInvoiceFields();
  }


  // ─────────────────────────────────────────────────────────────
  // EVENT DELEGATION
  // ─────────────────────────────────────────────────────────────

  // Ascolta i "change" su document per sapere se l’utente ha cliccato la checkbox fattura
  document.addEventListener('change', function(event) {
    if (event.target && event.target.matches('#invoice-checkbox')) {
      syncCheckboxes(event.target.checked);
    }
  });

  // Ascolta l’evento "input" su document per sincronizzare i campi fattura
  document.addEventListener('input', function(event) {
    if (event.target && 
        (event.target.matches('#company-name') ||
         event.target.matches('#vat-number')   ||
         event.target.matches('#sdi-code'))) {
      syncFields(event.target);
    }
  });

  // Quando il carrello viene aggiornato (evento custom di Shopify)
  document.addEventListener('cart:updated', restoreInvoiceCheckboxState);

  // All’avvio, ripristina la giusta visibilità e validazione
  restoreInvoiceCheckboxState();
});
