/* eslint-disable @typescript-eslint/no-empty-function */
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../../assets/styles/global';
import ThemeRadioButton from '../ThemeRadioButton';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import defaultTheme from '../../assets/styles/themes/default';
import darkTheme from '../../assets/styles/themes/dark';

import sun from '../../assets/images/icons/sun.svg';
import moon from '../../assets/images/icons/moon.svg';
import useLocalState from '../../hooks/useLocalState';
import { AppContainer, Container, PageContainer, ThemeRadioButtonsContainer } from './styles';
import Header from './components/Header';
import useApp from './useApp';
import NoData from '../NoData';
import Filters from './components/Filters';
import OpacityAnimation from '../OpacityAnimation';
import DisplayMap from './components/DisplayMap';

export default function App() {
	const [theme, setTheme] = useLocalState('theme', defaultTheme);

	const {
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
	} = useApp();

	const hasData = dataFromCsv.length > 0;
	const isSomeWorkplaceSelected = !!(selectedWorkplace.value);

	return (
		<ThemeProvider theme={theme}>
			<GlobalStyles />
			<Container>
				<AppContainer>
					<PageContainer>
						<div className="darkMode">
							<ThemeRadioButtonsContainer>
								<ThemeRadioButton
									onClick={() => setTheme(defaultTheme)}
									selected={theme.colors.background != '#121212'}
								>
									<img src={sun} alt="lightTheme" />
								</ThemeRadioButton>

								<ThemeRadioButton
									onClick={() => setTheme(darkTheme)}
									selected={theme.colors.background == '#121212'}
								>
									<img src={moon} alt="darkTheme" />
								</ThemeRadioButton>
							</ThemeRadioButtonsContainer>
						</div>
						<Header hasData={hasData} onImportCsv={handleFileUpload} downloadCsvModel={downloadCsvModel} />

						{hasData && (
							<Filters
								workplacesOptions={workplacesOptions}
								selectedWorkplace={selectedWorkplace}
								selectedEmployee={selectedEmployee}
								employeesOptions={employeesOptions}
								handleSelectedWorkplaceChange={handleSelectedWorkplaceChange}
								handleSelectedEmployeeChange={handleSelectedEmployeeChange}
								isSomeWorkplaceSelected={isSomeWorkplaceSelected}
							/>
						)}

						{hasData && isSomeWorkplaceSelected && (
							<DisplayMap
								data={filteredData}
								selectedEmployee={selectedEmployee}
								selectedWorkplace={selectedWorkplace}
							/>
						)}

						{hasData && !isSomeWorkplaceSelected && (
							<OpacityAnimation delay={0.1}>
								<NoData
									icon="workplaceInterrogation"
									label={(
										<>
                      Selecione um local de trabalho acima para visualizar seu mapa de tendência
										</>
									)}
								/>
							</OpacityAnimation>
						)}

						{!hasData && (
							<OpacityAnimation delay={0.1}>
								<NoData
									icon="emptyBox"
									label={(
										<>
                      Não há nenhum CSV importado para exibição do mapa. Clique no botão
											{' '}
											<strong>Importar CSV</strong>
											{' '}
                      acima para importar um arquivo. Se atente para importar de acordo com o modelo, que pode ser baixado clicando no botão <strong>Modelo CSV</strong>!
										</>
									)}
								/>
							</OpacityAnimation>
						)}
					</PageContainer>
				</AppContainer>
			</Container>
			<ToastContainer
				position="bottom-center"
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="dark"
			/>
		</ThemeProvider>
	);
}
