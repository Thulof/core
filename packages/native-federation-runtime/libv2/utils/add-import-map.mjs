export function appendImportMap(importMap) {
  document.head.appendChild(
    Object.assign(document.createElement('script'), {
      type: 'importmap-shim',
      innerHTML: JSON.stringify(importMap),
    }),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkLWltcG9ydC1tYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9saWJzL25hdGl2ZS1mZWRlcmF0aW9uLXJ1bnRpbWUvc3JjL2xpYi91dGlscy9hZGQtaW1wb3J0LW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLFVBQVUsZUFBZSxDQUFDLFNBQW9CO0lBQ2xELFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUN2QixNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDOUMsSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7S0FDckMsQ0FBQyxDQUNILENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW1wb3J0TWFwIH0gZnJvbSAnLi4vbW9kZWwvaW1wb3J0LW1hcCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kSW1wb3J0TWFwKGltcG9ydE1hcDogSW1wb3J0TWFwKSB7XHJcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChcclxuICAgIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JyksIHtcclxuICAgICAgdHlwZTogJ2ltcG9ydG1hcC1zaGltJyxcclxuICAgICAgaW5uZXJIVE1MOiBKU09OLnN0cmluZ2lmeShpbXBvcnRNYXApLFxyXG4gICAgfSlcclxuICApO1xyXG59XHJcbiJdfQ==
