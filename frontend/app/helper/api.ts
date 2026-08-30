import axios from "axios";
import { vehicle_type, request_type, filterType } from "./type";
import {dateConvert} from "./utils";

const veh_type2 = ["car", "bike", "motorbike"];
const apiToStateKey: Record<string, keyof vehicle_type> = {
  car: "cars",
  bike: "bikes",
  motorbike: "motorbikes"
};

export class ApiCall {
    
    async query_vehicles_by_apt(apt_id: string) {
        try {        
            if(apt_id == "" || apt_id == null) {
                throw new Error("No apt found");
            }
            const res = await axios.get("http://localhost:3001/api/vehicles/query-by-apt", {      
                params: {
                    apt_id: apt_id
                }
            });
            return res;
        }
        catch(error) {
            throw new Error(error.message);
        }
    }
    async query_request_by_apt(apt_id: string) {
        try {
            if(apt_id == "" || apt_id == null) {
                throw new Error("No apt found");
            }
            //console.log(apt_id);
            const res = await axios.get("http://localhost:3001/api/vehicles/query-request-by-apt", {      
                params: {
                    apt_id: apt_id,
                }
            });
            //console.log(apt_id);
            //console.log("Response:", res.data);
            return res;
        } catch (err) {
            console.log(err.message);
        }
    }

    async count_each_type_with_apt(apt_id: string, type: string) {
        try {
            if (!apt_id) throw new Error("No apt found");
            const res = await axios.get("http://localhost:3001/api/vehicles/count-by-apt-type", {
                params: { apt_id: apt_id, type: type }
            });
            console.log(type);
            console.log(res.data.count);
            return res.data.count;
        }
        catch(error) {
            throw new Error(error.message);
        }
        
    }

    async count_each_type(type: string) {
        try {
            if (!type) throw new Error("No apt found");
            const res = await axios.get("http://localhost:3001/api/vehicles/count-all-by-type", {
                params: { type: type }
            });
            console.log(type);
            console.log(res.data.count);
            return res.data.count;
        }
        catch(error) {
            throw new Error(error.message);
        }
        
    }

    async request_new_vehicle(
        apt_id: string,
        number: string,
        type: string,
        color: string,
        owner: string,
        created_by?: string
    ) {
        try {
            const requestData: any = {      
                apt_id: apt_id,
                owner: owner,
                type: type,
                number: number,
                color: color
            };
            
            if (created_by) {
                requestData.created_by = created_by;
            }
            
            const res = await axios.post("http://localhost:3001/api/vehicles/insert-request", requestData);
            return res.data;
        }
        catch(error) {
            console.log(error.message);
            throw new Error(error.message);
        }
    }

    async query_all_request(page_number, page_size) {
        try {
            const res = await axios.get("http://localhost:3001/api/vehicles/query-all-request", {      
                params: {
                    page_number,
                    page_size
                }
            });
            //console.log("Response:", dateConvert(res.data.result.data[0].created_at));
       
            return res.data.result;
        } catch (err) {
            console.log(err);
            throw new Error(err.message);
        }   
    }

    async delete_request(number) {
        try {
            const res = await axios.post("http://localhost:3001/api/vehicles/delete-request", {
                number
            });
            return res
        }
        catch(error) {
            throw new Error(error.message);
        }
    } 

    async accept_request(request: request_type, monthly_fee?: number) {
        try {
            const res = await axios.post("http://localhost:3001/api/vehicles/approve-request", {
                number: request.number,
                monthly_fee: monthly_fee
            });
            return res;
        }
        catch(error) {
            console.log(error.message);
            throw new Error(error.message);
        }
    }

    async reject_request(number: string, rejection_reason?: string) {
        try {
            const res = await axios.post("http://localhost:3001/api/vehicles/reject-request", {
                number: number,
                rejection_reason: rejection_reason || 'No reason provided'
            });
            return res;
        }
        catch(error) {
            console.log(error.message);
            throw new Error(error.message);
        }
    }

    async search_vehicles_with_filter(filter: filterType, page_number, page_size) {
        try {
            const res = await axios.get("http://localhost:3001/api/vehicles/query-with-filter", {      
                params: {
                    page_number: page_number,
                    page_size: page_size,
                    filter
                }
            });
            console.log(res.data.result);
            return res.data.result;
        } 
        catch (err) {
            console.log(err.message);
            throw new Error(err.message);
        }
    }

    async query_all_bill(owner, page_size, page_number) {
        try {
            const res = await axios.get("http://localhost:3001/api/bills/query-by-owner", {      
                params: {
                    page_number,
                    page_size,
                    owner
                }
            });
            console.log(res.data.result);
            return res.data.result;

        } catch (err) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async query_bill_with_filter(filter, page_number, page_size) {
         try {
            const params = {
                page_number,
                page_size,
                filter: typeof filter === 'object' ? JSON.stringify(filter) : filter
            };
            const res = await axios.get("http://localhost:3001/api/bills/query-with-filter", { params });
            console.log(res.data.result);
            return res.data.result;

        } catch (err) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async reset_bill(apt_id, period = null) {
         try {
            const payload: any = { apt_id };
            if (period) payload.period = period;
            const res = await axios.patch("http://localhost:3001/api/bills/reset", payload);
            console.log("Response:", res.data);
            return res.data;
        } catch (err) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async update_bill(apt_id, bill_value) {
        try {
            const res = await axios.patch("http://localhost:3001/api/bills/update", {      
                apt_id,
                bill: bill_value
            });
            console.log("Response:", res.data);
            return res;
        } catch (err) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async get_total_collected() {
        try {
            const res = await axios.get("http://localhost:3001/api/bills/query-all-collected", {      
            
            });
            console.log("Response:", res.data.data);
            return res.data.result;
        } catch (err) {
            console.log(err);
        }
    }

    async collect_bill(apt_id, total) {
        try {
            const res = await axios.post("http://localhost:3001/api/bills/collect-bill", {      
                apt_id,
                total
            });
            console.log("Response:", res.data);
            return res;
        } catch (err) {
            console.log(err);
        }
    }
}



