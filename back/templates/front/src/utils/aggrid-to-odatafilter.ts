import { ColDef } from "ag-grid-community";
import { textFilterToReplace } from "../app/components/datagrid/datagrid.component";
import { DateTime } from "luxon";

export function mapAgGridFiltersToOData(filter: any, key: string, columnDefs: ColDef[]): string {
  const column = columnDefs.find((col) => col.field === key);
  const overrideFilter = column?.filterParams?.filterKey as string | undefined;
  const filterValues =
    filter.values?.map((v: string) => (v.startsWith("'") && v.endsWith("'") ? v : `'${v}'`)).join(",") ?? "";
  const filterKey = overrideFilter ?? key;
  const toLowerFilterKey = `tolower(${filterKey})`;

  switch (filter.filterType) {
    case "object":
      return `${key}/id in (${filterValues})`;
    case "array":
      return overrideFilter
        ? overrideFilter.replace(textFilterToReplace, filterValues)
        : `${key}/any(e: e/id in (${filterValues}))`;
    case "text":
      switch (filter.type) {
        case "equals":
          return `${toLowerFilterKey} eq tolower('${filter.filter}')`;
        case "notEqual":
          return `${toLowerFilterKey} ne tolower('${filter.filter}')`;
        case "contains":
        case "notContains":
          return `contains(${toLowerFilterKey}, tolower('${filter.filter}'))`;
        case "startsWith":
          return `startswith(${toLowerFilterKey}, tolower('${filter.filter}'))`;
        case "endsWith":
          return `endswith(${toLowerFilterKey}, tolower('${filter.filter}'))`;
      }
      break;
    case "number":
      switch (filter.type) {
        case "equals":
          return `${filterKey} eq ${filter.filter}`;
        case "notEqual":
          return `${filterKey} ne ${filter.filter}`;
        case "lessThan":
          return `${filterKey} lt ${filter.filter}`;
        case "lessThanOrEqual":
          return `${filterKey} le ${filter.filter}`;
        case "greaterThan":
          return `${filterKey} gt ${filter.filter}`;
        case "greaterThanOrEqual":
          return `${filterKey} ge ${filter.filter}`;
      }
      break;
    case "date":
      switch (filter.type) {
        case "equals":
          return `${filterKey} eq ${new Date(filter.dateFrom).toISOString()}`;
        case "lessThan":
          return `${filterKey} lt ${DateTime.fromJSDate(new Date(filter.dateFrom)).startOf("day")}`;
        case "greaterThan":
          return `${filterKey} gt ${DateTime.fromJSDate(new Date(filter.dateFrom)).endOf("day")}`;
        case "inRange":
          return `${filterKey} ge ${DateTime.fromJSDate(new Date(filter.dateFrom)).startOf("day")} and ${filterKey} le ${DateTime.fromJSDate(new Date(filter.dateTo)).endOf("day")}`;
      }
      break;
  }
  return "";
}
