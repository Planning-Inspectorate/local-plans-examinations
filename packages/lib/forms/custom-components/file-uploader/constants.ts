export const ALLOWED_EXTENSIONS = [
	'pdf',
	'doc',
	'docx',
	'ppt',
	'pptx',
	'xls',
	'xlsx',
	'xlsm',
	'msg',
	'jpg',
	'jpeg',
	'mpg',
	'mpeg',
	'mp3',
	'mp4',
	'mov',
	'png',
	'tif',
	'tiff',
	'dbf',
	'html',
	'prj',
	'shp',
	'shx',
	'gis'
];

export const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-excel.sheet.macroenabled.12',
	'application/vnd.ms-excel.sheet.macroEnabled.12',
	'application/vnd.ms-outlook',
	'image/jpeg',
	'video/mpeg',
	'audio/mpeg',
	'video/MP1S',
	'video/mp4',
	'video/quicktime',
	'image/png',
	'image/tiff',
	'application/vnd.dbf',
	'text/html',
	'application/x-prj',
	'application/x-shapefile',
	'application/x-shx',
	'application/octet-stream',
	'application/x-gis'
];

// Constants to define the single file upload limit and the total file upload limit
const MB = 1024 * 1024;
export const SINGLE_FILE_UPLOAD_LIMIT = 250 * MB; // 250MB
export const SINGLE_FILE_UPLOAD_LIMIT_LABEL = '250MB';

export const TOTAL_FILE_UPLOAD_LIMIT = 1024 * MB; // 1GB
export const TOTAL_FILE_UPLOAD_LIMIT_LABEL = '1GB'; // 1GB

export const MAX_NO_OF_FILES_TO_UPLOAD = 3;
