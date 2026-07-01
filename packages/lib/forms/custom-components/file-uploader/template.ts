export const fileUploaderNunjucksTemplate = String.raw`{% extends layoutTemplate %}

{% from "govuk/components/button/macro.njk" import govukButton %}
{% from "govuk/components/error-summary/macro.njk" import govukErrorSummary %}
{% from "govuk/components/file-upload/macro.njk" import govukFileUpload %}

{% block before_content %}
	{% if backLink %}
		<a href="{{ backLink }}" class="govuk-back-link">Back</a>
	{% endif %}
	{% if errorSummary %}
		{{ govukErrorSummary({
			titleText: "There is a problem",
			errorList: errorSummary
		}) }}
	{% endif %}
{% endblock before_content %}

{% block content %}
	<div class="govuk-grid-row">
		<div class="govuk-grid-column-two-thirds">
			{% if question.text.caption %}
				<span class="govuk-caption-l">{{ question.text.caption }}</span>
			{% endif %}
			<h1 class="govuk-heading-l">{{ question.question }}</h1>

			{% if question.text.introduction %}
				<p class="govuk-body">{{ question.text.introduction }}</p>
			{% endif %}

			{% if question.text.bulletList and question.text.bulletList.length %}
				<ul class="govuk-list govuk-list--bullet">
					{% for item in question.text.bulletList %}
						<li>{{ item }}</li>
					{% endfor %}
				</ul>
			{% endif %}

			{% if question.text.fileRequirementsText %}
				<p class="govuk-body">{{ question.text.fileRequirementsText }}</p>
			{% endif %}

			{% if question.text.totalUploadSizeText %}
				<p class="govuk-body">{{ question.text.totalUploadSizeText }}</p>
			{% endif %}

			{% if uploadedFiles and uploadedFiles.length %}
				<dl class="govuk-summary-list">
					{% for file in uploadedFiles %}
						<div class="govuk-summary-list__row">
							<dt class="govuk-summary-list__value">{{ file.fileName }}</dt>
							<dd class="govuk-summary-list__actions">
								<form id="deleteForm{{ loop.index }}" action="{{ currentUrl }}/delete-document/{{ file.id | urlencode }}" method="post">
									<input type="hidden" name="_csrf" value="{{ _csrf }}">
									<button class="govuk-link govuk-!-font-size-19" type="submit">
										{{ question.text.removeLinkText or "Remove" }}
										<span class="govuk-visually-hidden">{{ file.fileName }}</span>
									</button>
								</form>
							</dd>
						</div>
					{% endfor %}
				</dl>
			{% endif %}

			<form id="upload-form" method="post" enctype="multipart/form-data" action="{{ currentUrl }}/upload-documents">
				<input type="hidden" name="_csrf" value="{{ _csrf }}">
				{{ govukFileUpload({
					id: question.fieldName,
					name: "files[]",
					label: {
						text: question.text.uploadLabel or "Upload files",
						classes: "govuk-visually-hidden"
					},
					javascript: true,
					multiple: question.multiple,
					chooseFilesButtonText: question.text.chooseFilesButtonText or "Choose files",
					dropInstructionText: question.text.dropInstructionText or "or drop files",
					attributes: {
						accept: question.allowedMimeTypes | join(", ")
					},
					errorMessage: errors["upload-form"] and {
						text: errors["upload-form"].msg
					}
				}) }}
				{{ govukButton({ text: question.text.uploadButtonText or "Upload selected files" }) }}
			</form>

			<form action="" method="post" novalidate>
				<input type="hidden" name="_csrf" value="{{ _csrf }}">
				<input type="hidden" name="{{ question.fieldName }}" value='{{ uploadedFilesEncoded | safe }}'>
				{{ govukButton({
					text: question.text.continueButtonText or continueButtonText or "Continue",
					type: "submit"
				}) }}
			</form>

			{% if question.text.returnLink %}
				<p class="govuk-body">
					<a class="govuk-link" href="{{ question.text.returnLink.href }}">{{ question.text.returnLink.text }}</a>
				</p>
			{% endif %}
		</div>
	</div>
{% endblock %}`;
