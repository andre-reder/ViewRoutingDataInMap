/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLayoutEffect, useRef } from 'react';
import blueEmployeeIcon from '../../../../assets/images/icons/blueEmployeeIcon.svg';
import company from '../../../../assets/images/icons/company.svg';
import employeeIcon from '../../../../assets/images/icons/employee.svg';
import greenEmployeeIcon from '../../../../assets/images/icons/greenEmployeeIcon.svg';
import formatCurrency from '../../../../utils/formatCurrency';
import OpacityAnimation from '../../../OpacityAnimation';
import { DataFromCsvMappedType, WorkplaceType } from '../../types';

interface DisplayMapInterface {
  data: DataFromCsvMappedType[];
  selectedWorkplace: WorkplaceType;
  selectedEmployee: { value: string, label: string };
}

type CoordType = { lat: string, lng: string };

export default function DisplayMap({ data, selectedWorkplace, selectedEmployee }: DisplayMapInterface) {
	const mapRef = useRef(null);

	useLayoutEffect(() => {
		const employees = data.map((i) => (
			{
				lat: i.employeeLat,
				lng: i.employeeLng,
				name: i.name,
				cpf: `•••.•••.${i.cpf?.slice(8, 16)}`,
				cpfWithoutMask: i.cpf,
				consultCode: i.consultCode,
				oldValue: i.oldValue,
				newValue: i.newValue,
				savedValue: Number(i.oldValue) - Number(i.newValue),
				optimized: Number(i.newValue) < Number(i.oldValue),
				streetName: i.employeeStreetName,
				number: i.employeeNumber,
				cep: i.employeeCep,
				entryTime: i.entryTime,
				exitTime: i.exitTime,
			}
		));
		const selectedEmployeeData = employees.find((employee) => employee.cpfWithoutMask === selectedEmployee.value);
		const ltCoords = { lat: selectedWorkplace.lat, lng: selectedWorkplace.lng };

		if (!mapRef.current) return undefined;
		const { H } = window;
		const platform = new H.service.Platform({
			apikey: 'j_2nd1oo9KEEZjtXMr00yXv-lGuogKpehnyWQfs-zJM',
		});
		const defaultLayers = platform.createDefaultLayers();
		// Create an instance of the map
		const mapInstance = new H.Map(
			mapRef.current,
			defaultLayers.vector.normal.map,
			{
				center: selectedEmployee.value
					? { lat: selectedEmployeeData?.lat, lng: selectedEmployeeData?.lng }
					: ltCoords,
				zoom: 10.5,
				pixelRatio: window.devicePixelRatio || 1,
			},
		);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(mapInstance));
		const ui = H.ui.UI.createDefault(mapInstance, defaultLayers);

		function addMarkersToMap(map: any) {
			const ltIcon = new H.map.Icon(company, {
				size: {
					h: 32,
					w: 32
				}
			});
			const ltMarker = new H.map.Marker(ltCoords, { icon: ltIcon });
			function addMarkerToGroup(group: any, coordinate: CoordType, html: string) {
				const marker = new H.map.Marker(coordinate, { icon: ltIcon });
				// add custom data to the marker
				marker.setData(html);
				group.addObject(marker);
			}
			function addInfoBubble(mp: any) {
				const group = new H.map.Group();
				mp.addObject(group);

				// add 'tap' event listener, that opens info bubble, to the group
				group.addEventListener('tap', (evt: any) => {
					// event target is the marker itself, group is a parent event target
					// for all objects that it contains
					const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
						// read custom data
						content: evt.target.getData(),
					});
					// show info bubble
					ui.addBubble(bubble);
				}, false);

				addMarkerToGroup(
					group,
					ltCoords,
					`<div style="
              min-inline-size: max-content;
          ">
            ${selectedWorkplace.label}
            <br>
            Código: ${selectedWorkplace.value}
            <br>
            Endereço: ${selectedWorkplace.streetName}, ${selectedWorkplace.number} - ${selectedWorkplace.cep}
          </div>`,
				);
			}
			map.addObject(ltMarker);
			addInfoBubble(map);

			employees.forEach((employee) => {
				const optimizedEmployeeIcon = new H.map.Icon(greenEmployeeIcon);
				const notOptimizedEmployeeIcon = new H.map.Icon(employeeIcon);
				const selectedEmployeeIcon = new H.map.Icon(blueEmployeeIcon, {
					size: {
						h: 32,
						w: 32
					}
				});
				const employeeCoord = { lat: employee.lat, lng: employee.lng };

				const choosedIcon = (
					employee.cpfWithoutMask === selectedEmployee.value
						? selectedEmployeeIcon
						: (employee.optimized ? optimizedEmployeeIcon : notOptimizedEmployeeIcon)
				);
				const employeeMarker = new H.map.Marker(employeeCoord, { icon: choosedIcon });

				function addMarkerToGroup(group: any, coordinate: CoordType, html: string) {
					const marker = new H.map.Marker(coordinate, { icon: choosedIcon });
					// add custom data to the marker
					marker.setData(html);
					group.addObject(marker);
				}

				function addInfoBubble(mp: any) {
					const group = new H.map.Group();
					mp.addObject(group);

					// add 'tap' event listener, that opens info bubble, to the group
					group.addEventListener('tap', (evt: any) => {
						// event target is the marker itself, group is a parent event target
						// for all objects that it contains
						const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
							// read custom data
							content: evt.target.getData(),
						});
						// show info bubble
						ui.addBubble(bubble);
					}, false);

					addMarkerToGroup(
						group,
						employeeCoord,
						`<div style="
                min-inline-size: max-content;
            ">
              CPF: ${employee.cpf}
              <br>
              Consulta: ${employee.consultCode}
              <br>
              VT Informado: ${formatCurrency(Number(employee.oldValue))}
              <br>
              VT Roteirizado: ${formatCurrency(Number(employee.newValue))}
              <br>
              Status: ${employee.optimized ? 'Otimizado' : 'Não otimizado'}
              <br>
              Economia: ${formatCurrency(Number(employee.savedValue))}
              <br>
              Horário: ${employee.entryTime} - ${employee.exitTime}
              <br>
              Endereço: ${employee.streetName}, ${employee.number} - ${employee.cep}
            </div>`,
					);
				}
				map.addObject(employeeMarker);
				addInfoBubble(map);
			});
		}

		addMarkersToMap(mapInstance);

		return () => {
			mapInstance.dispose();
		};
	}, [data, mapRef, selectedEmployee, selectedWorkplace]);

	return (
		<OpacityAnimation delay={0.1}>
			<div ref={mapRef} style={{ height: '500px', width: '100%' }} />
		</OpacityAnimation>
	);
}
