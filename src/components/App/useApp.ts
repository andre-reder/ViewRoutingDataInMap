/* eslint-disable @typescript-eslint/no-explicit-any */
import Papa from 'papaparse';
import { ChangeEvent, useState } from 'react';
import { toast } from 'react-toastify';
import extractNumbers from '../../utils/extractNumbers';
import hasDesiredKeysAndValues from '../../utils/hasDesiredKeysAndValues';
import hasDuplicates from '../../utils/hasDuplicatedValueAtArray';
import isValidCoordFromCsv from '../../utils/isValidCoordFromCsv';
import removeDuplicates from '../../utils/removeDuplicates';
import { DataFromCsvMappedType, WorkplaceType } from './types';

interface CustomParseResult<T> extends Papa.ParseResult<T> {
  data: T[];
}

export default function useApp() {
	const [dataFromCsv, setDataFromCsv] = useState<DataFromCsvMappedType[]>([]);
	const [filteredData, setFilteredData] = useState<DataFromCsvMappedType[]>([]);
	const [selectedWorkplace, setSelectedWorkplace] = useState<WorkplaceType>({ value: '', label: 'Selecione um local de trabalho'} as WorkplaceType);
	const [selectedEmployee, setSelectedEmployee] = useState<{ value: string, label: string }>({ value: '', label: 'Selecione um funcionário'} as { value: string, label: string });
	const [workplacesOptions, setWorkplacesOptions] = useState<WorkplaceType[]>([{
		value: '',
		label: 'Selecione um local de trabalho',
		lat: '',
		lng: '',
		cep: '',
		streetName: '',
		number: '',
	}]);
	const [employeesOptions, setEmployeesOptions] = useState([{
		value: '', label: 'Selecione um funcionário'
	}]);

	const desiredHeaders = ['CEP_FUNC', 'CEP_LOCAL', 'COD_CONSULTA', 'COD_LOCAL', 'CPF', 'DESCR_LOCAL', 'HR_ENT', 'HR_SAI', 'LAT_FUNC', 'LAT_LOCAL', 'LOGRADOURO_FUNC', 'LOGRADOURO_LOCAL', 'LONG_FUNC', 'LONG_LOCAL', 'NOME', 'NUM_FUNC', 'NUM_LOCAL', 'VT_INFORMADO', 'VT_ROT'];

	function handleSelectedWorkplaceChange(workplace: WorkplaceType) {
		setSelectedWorkplace(workplace);
		setSelectedEmployee({ value: '', label: 'Selecione um funcionário' });
		const employeesAtWorkplace = dataFromCsv.filter((employee) =>(
			employee.workplaceCode === workplace.value
		));
		const mappedEmployeesOptions = employeesAtWorkplace.map((employee) => (
			{
				value: `${employee.cpf} ${employee.name}`,
				label: `Consulta ${employee.consultCode}`,
			}
		));
		setEmployeesOptions(mappedEmployeesOptions);
		setFilteredData(employeesAtWorkplace);
	}

	function handleSelectedEmployeeChange(employee: { value: string, label: string }) {
		setSelectedEmployee(employee);
	}

	function downloadCsvModel() {
		const link = document.createElement('a');
		link.href = '/files/Modelo importar dados mapa tendencia.csv';
		link.download = 'Modelo importar dados mapa tendencia';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function parseFile(file: File):Promise<CustomParseResult<any>> {
		return new Promise((resolve, reject) => {
			const parsedData: any[] = [];

			Papa.parse(file, {
				header: true,
				chunkSize: 5000,
				chunk: (results, parser) => {
					const data: Array<any> = results.data;
					const isLastIndexEmptyCpf = !(data[data.length - 1].CPF);
					if (isLastIndexEmptyCpf) {
						data.pop();
					}

					const hasDesiredHeadersAndValues = hasDesiredKeysAndValues(data, desiredHeaders);
					if (!hasDesiredHeadersAndValues) {
						reject(new Error('Identificamos que o arquivo enviado não está com os mesmos cabeçalhos do modelo a ser seguido, ou algum campo foi preenchdio em branco'));
						parser.abort();
						return;
					}

					const allCoords = [];
					for (let i = 0; i < data.length; i++) {
						const obj = data[i];
						allCoords.push(obj['LAT_FUNC']);
						allCoords.push(obj['LONG_FUNC']);
						allCoords.push(obj['LAT_LOCAL']);
						allCoords.push(obj['LONG_LOCAL']);
					}
					const areAllCoordsValid = allCoords.every((coord) => isValidCoordFromCsv(coord));
					if (!areAllCoordsValid) {
						reject(new Error('Identificamos que existe alguma coordenada em um formato diferente do modelo'));
						parser.abort();
						return;
					}

					const mappedArray = data.map((index) => ({
						cpf: index.CPF,
						consultCode: index.COD_CONSULTA,
						name: index.NOME,
						employeeStreetName: index.LOGRADOURO_FUNC,
						employeeNumber: index.NUM_FUNC,
						employeeCep: index.CEP_FUNC,
						employeeLat: index.LAT_FUNC.replaceAll('_', '.'),
						employeeLng: index.LONG_FUNC.replaceAll('_', '.'),
						entryTime: index.HR_ENT,
						exitTime: index.HR_SAI,
						oldValue: extractNumbers(index.VT_INFORMADO.replaceAll(',', '.')),
						newValue: extractNumbers(index.VT_ROT.replaceAll(',', '.')),
						workplaceCode: index.COD_LOCAL,
						workplaceCep: index.CEP_LOCAL,
						workplaceStreetName: index.LOGRADOURO_LOCAL,
						workplaceNumber: index.NUM_LOCAL,
						workplaceName: index.DESCR_LOCAL,
						workplaceLat: index.LAT_LOCAL.replaceAll('_', '.'),
						workplaceLng: index.LONG_LOCAL.replaceAll('_', '.'),
					}));
					parsedData.push(...mappedArray);
				},
				complete: () => {
					const onlyCpfs = [];
					for (let i = 0; i < parsedData.length; i++) {
						const index = parsedData[i];
						onlyCpfs.push(index.cpf);
					}
					if (hasDuplicates(onlyCpfs)) {
						reject(new Error('Identificamos uma ou mais duplicidades de CPF no arquivo') );
						return;
					}
					const customResult: CustomParseResult<any> = {
						data: parsedData,
						errors: [],
						meta: {
							delimiter: '',
							linebreak: '',
							aborted: false,
							truncated: false,
							cursor: 0,
						},
					};
					resolve(customResult);
				},
				error: reject,
			});
		});
	}

	async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
		const { files } = e.target;
		if (files) {
			try {
				const results = await toast.promise(parseFile(files[0]), {
					pending: 'Aguarde, estamos carregando este arquivo',
					success: 'Seu arquivo está válido. Agora basta visualizar seu mapa da forma que desejar!',
					error: 'Ocorreu um erro ao carregar seu arquivo',
				});
				const resultArray: DataFromCsvMappedType[] = results.data;

				const mappedWorkplaces = [];
				for (let i = 0; i < resultArray.length; i++) {
					const index = resultArray[i];
					mappedWorkplaces.push({
						value: index.workplaceCode,
						label: index.workplaceName,
						lat: index.workplaceLat,
						lng: index.workplaceLng,
						cep: index.workplaceCep,
						streetName: index.workplaceStreetName,
						number: index.workplaceNumber,
					});
				}
				setWorkplacesOptions(removeDuplicates(mappedWorkplaces));
				setDataFromCsv(resultArray);
			} catch (error) {
				toast.error(`Não foi possível processar este arquivo (${error})`);
				setDataFromCsv([]);
			}
		}
	}

	return {
		dataFromCsv,
		downloadCsvModel,
		handleFileUpload,
		workplacesOptions,
		filteredData,
		selectedWorkplace,
		selectedEmployee,
		employeesOptions,
		handleSelectedWorkplaceChange,
		handleSelectedEmployeeChange,
	};
}
