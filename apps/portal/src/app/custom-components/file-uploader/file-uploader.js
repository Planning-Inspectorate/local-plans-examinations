/* global document, XMLHttpRequest, FormData */
(function () {
	'use strict';

	var form = document.querySelector('[data-module="multi-file-upload"]');
	if (!form) return;

	var uploadUrl = form.getAttribute('data-upload-url');
	var deleteUrl = form.getAttribute('data-delete-url');
	var csrf = form.getAttribute('data-csrf');
	var fileInput = form.querySelector('input[type="file"]');
	var fileList = document.getElementById('files-added-list');

	if (!fileInput || !uploadUrl || !deleteUrl || !fileList) return;

	// Prevent the form from submitting normally when files are selected
	form.addEventListener('submit', function (e) {
		// Only allow submission from the "Save and return" button
		var submitBtn = e.submitter;
		if (submitBtn && submitBtn.classList.contains('govuk-button--secondary')) {
			e.preventDefault();
			handleFileChange();
		}
	});

	function createUploadingRow(file, xhr) {
		var row = document.createElement('div');
		row.className = 'govuk-summary-list__row';
		row.setAttribute('data-uploading', 'true');

		var dt = document.createElement('dt');
		dt.className = 'govuk-summary-list__key';
		dt.innerHTML = file.name + ' (<span class="multi-file-upload__progress">0%</span>)';

		var ddActions = document.createElement('dd');
		ddActions.className = 'govuk-summary-list__actions';
		var cancelLink = document.createElement('a');
		cancelLink.href = '#';
		cancelLink.className = 'govuk-link';
		cancelLink.textContent = 'Cancel';
		cancelLink.addEventListener('click', function (e) {
			e.preventDefault();
			xhr.abort();
			row.remove();
		});
		ddActions.appendChild(cancelLink);

		row.appendChild(dt);
		row.appendChild(ddActions);
		fileList.appendChild(row);

		return row;
	}

	function createUploadedRow(fileData) {
		var row = document.createElement('div');
		row.className = 'govuk-summary-list__row';
		row.setAttribute('data-file-id', fileData.id);

		var dt = document.createElement('dt');
		dt.className = 'govuk-summary-list__key';
		dt.textContent = fileData.fileName + ' (100%)';

		var ddActions = document.createElement('dd');
		ddActions.className = 'govuk-summary-list__actions';
		var removeLink = document.createElement('a');
		removeLink.href = '#';
		removeLink.className = 'govuk-link multi-file-upload__delete';
		removeLink.setAttribute('data-file-id', fileData.id);
		removeLink.innerHTML = 'Remove<span class="govuk-visually-hidden"> ' + fileData.fileName + '</span>';
		ddActions.appendChild(removeLink);

		row.appendChild(dt);
		row.appendChild(ddActions);

		return row;
	}

	function uploadFile(file) {
		var xhr = new XMLHttpRequest();
		var row = createUploadingRow(file, xhr);

		var formData = new FormData();
		formData.append('files[]', file);
		formData.append('_csrf', csrf);

		xhr.upload.addEventListener('progress', function (e) {
			if (e.lengthComputable) {
				var percent = Math.round((e.loaded / e.total) * 100);
				var progressEl = row.querySelector('.multi-file-upload__progress');
				if (progressEl) {
					progressEl.textContent = percent + '%';
				}
			}
		});

		xhr.addEventListener('load', function () {
			if (xhr.status >= 200 && xhr.status < 400) {
				var response;
				try {
					response = JSON.parse(xhr.responseText);
				} catch {
					showRowError(row, 'Upload failed');
					return;
				}

				if (response.files && response.files.length > 0) {
					var uploadedRow = createUploadedRow(response.files[0]);
					row.parentNode.replaceChild(uploadedRow, row);
				} else if (response.errors && response.errors.length > 0) {
					showRowError(row, response.errors[0].text);
				}
			} else {
				showRowError(row, 'Upload failed');
			}
		});

		xhr.addEventListener('error', function () {
			showRowError(row, 'Upload failed');
		});

		xhr.addEventListener('abort', function () {
			// Row already removed by cancel handler
		});

		xhr.open('POST', uploadUrl);
		xhr.setRequestHeader('Accept', 'application/json');
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		xhr.send(formData);
	}

	function deleteFile(fileId, row) {
		var xhr = new XMLHttpRequest();
		var url = deleteUrl + '/' + encodeURIComponent(fileId);

		var formData = new FormData();
		formData.append('_csrf', csrf);

		xhr.addEventListener('load', function () {
			if (xhr.status >= 200 && xhr.status < 400) {
				row.remove();
			}
		});

		xhr.open('POST', url);
		xhr.setRequestHeader('Accept', 'application/json');
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		xhr.send(formData);
	}

	function showRowError(row, message) {
		var dt = row.querySelector('.govuk-summary-list__key');
		if (dt) {
			dt.innerHTML = dt.textContent.split('(')[0].trim() + ' <span class="govuk-error-message">' + message + '</span>';
		}
		var ddActions = row.querySelector('.govuk-summary-list__actions');
		if (ddActions) {
			ddActions.innerHTML = '';
		}
	}

	function handleFileChange() {
		var files = fileInput.files;
		if (!files || files.length === 0) return;

		for (var i = 0; i < files.length; i++) {
			uploadFile(files[i]);
		}

		// Clear the file input so the same file can be re-selected
		fileInput.value = '';
	}

	// Upload on file selection (AJAX)
	fileInput.addEventListener('change', handleFileChange);

	// Handle Remove clicks via event delegation on the file list
	fileList.addEventListener('click', function (e) {
		var link = e.target.closest('.multi-file-upload__delete');
		if (!link) return;

		e.preventDefault();
		var fileId = link.getAttribute('data-file-id');
		var row = link.closest('.govuk-summary-list__row');
		if (row && fileId) {
			deleteFile(fileId, row);
		}
	});
})();
