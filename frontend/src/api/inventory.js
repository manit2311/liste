import axiosInstance from "./axios";

export const inventoryAPI = {
  // params: {
  //   types: string[]      -> transaction_type=in,out
  //   usernames: string[]  -> username=manita,admin
  //   search: string
  //   qtyMin, qtyMax: number
  //   dateFrom, dateTo: 'YYYY-MM-DD'
  //   ordering: string     -> e.g. 'product__name' or '-transaction_date'
  //   page: number
  // }
  getAll: (params = {}) => {
    const {
      types = [],
      usernames = [],
      search = "",
      qtyMin = "",
      qtyMax = "",
      dateFrom = "",
      dateTo = "",
      ordering = "",
      page = 1,
    } = params;

    const qs = new URLSearchParams();
    if (types.length) qs.append("transaction_type", types.join(","));
    if (usernames.length) qs.append("username", usernames.join(","));
    if (search) qs.append("search", search);
    if (qtyMin !== "") qs.append("quantity_min", qtyMin);
    if (qtyMax !== "") qs.append("quantity_max", qtyMax);
    if (dateFrom) qs.append("date_from", dateFrom);
    if (dateTo) qs.append("date_to", dateTo);
    if (ordering) qs.append("ordering", ordering);
    if (page) qs.append("page", page);

    const url = qs.toString() ? `/inventory/?${qs.toString()}` : "/inventory/";
    return axiosInstance.get(url);
  },
  getUsernames: () => axiosInstance.get("/inventory/users/"),
  create: (data) => axiosInstance.post("/inventory/", data),
};
