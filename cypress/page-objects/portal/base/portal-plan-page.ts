import { BasePage } from '../../../page-objects/base-page.ts';

export class PortalPlanBasePage extends BasePage {
	pathFor(planReference: string): string {
		throw new Error(`${this.constructor.name} does not define pathFor for ${planReference}`);
	}

	visit(planReference: string) {
		cy.visit(this.pathFor(planReference));
	}

	verifyPathForPlan(planReference: string) {
		this.verifyPath(this.pathFor(planReference));
	}

	clickAddLink(addCy: string) {
		cy.getByData(addCy).should('be.visible').click();
	}

	verifyDocTableRows(table: Cypress.Chainable, rows: { document: string; status: string; addCy: string }[]) {
		table.within(() => {
			rows.forEach(({ document, status, addCy }) => {
				const row = cy.contains('tr', document);
				row.should('be.visible');
				row.should('contain.text', status);
				cy.getByData(addCy).should('be.visible');
			});
		});
	}

	verifyDocumentDownloadLink(table: Cypress.Chainable, document: string, fileName: string) {
		table.within(() => {
			const row = cy.contains('tr', document);
			row
				.contains('a', fileName)
				.should('be.visible')
				.invoke('attr', 'href')
				.then((href) => {
					cy.request(href as string).then((response) => {
						expect(response.status).to.equal(200);
						expect(response.headers['content-disposition']).to.include('attachment');
						expect(response.headers['content-disposition']).to.include(fileName);
					});
				});
		});
	}

	verifyDocumentRowContains(table: Cypress.Chainable, document: string, ...fileNames: string[]) {
		table.within(() => {
			const row = cy.contains('tr', document);
			fileNames.forEach((fileName) => {
				row.should('contain.text', fileName);
			});
			if (fileNames.length > 1) {
				row.find('ul.govuk-list--bullet li').should('have.length', fileNames.length);
			}
		});
	}

	verifyTableRowsInOrder(table: Cypress.Chainable, documents: string[]) {
		table.within(() => {
			cy.get('tbody tr').should('have.length', documents.length);
			documents.forEach((document, index) => {
				cy.get('tbody tr').eq(index).should('contain.text', document);
			});
		});
	}
}
