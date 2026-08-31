import axios from "axios";
import { vehicle_type, request_type, filterType } from "./type";
import { dateConvert } from "./utils";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").trim().replace(/\/+$/, '');

const getAuthHeaders = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
};

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
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/vehicles/query-by-apt`, {      
                params: {
                    apt_id: apt_id
                },
                headers
            });
            return res;
        }
        catch(error: any) {
            throw new Error(error.message);
        }
    }

    async query_request_by_apt(apt_id: string) {
        try {
            if(apt_id == "" || apt_id == null) {
                throw new Error("No apt found");
            }
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/vehicles/query-request-by-apt`, {      
                params: {
                    apt_id: apt_id,
                },
                headers
            });
            return res;
        } catch (err: any) {
            console.log(err.message);
        }
    }

    async count_each_type_with_apt(apt_id: string, type: string) {
        try {
            if (!apt_id) throw new Error("No apt found");
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/vehicles/count-by-apt-type`, {
                params: { apt_id: apt_id, type: type },
                headers
            });
            return res.data.count;
        }
        catch(error: any) {
            throw new Error(error.message);
        }
    }

    async count_each_type(type: string) {
        try {
            if (!type) throw new Error("No apt found");
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/vehicles/count-all-by-type`, {
                params: { type: type },
                headers
            });
            return res.data.count;
        }
        catch(error: any) {
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
            
            const headers = await getAuthHeaders();
            const res = await axios.post(`${API_BASE_URL}/vehicles/insert-request`, requestData, { headers });
            return res.data;
        }
        catch(error: any) {
            console.log(error.message);
            throw new Error(error.message);
        }
    }

    async query_all_request(page_number: number, page_size: number) {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/vehicles/query-all-request`, {      
                params: {
                    page_number,
                    page_size
                },
                headers
            });
            return res.data.result;
        } catch (err: any) {
            console.log(err);
            throw new Error(err.message);
        }   
    }

    async delete_request(number: string) {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.post(`${API_BASE_URL}/vehicles/delete-request`, {
                number
            }, { headers });
            return res;
        }
        catch(error: any) {
            throw new Error(error.message);
        }
    } 

    async accept_request(request: request_type, monthly_fee?: number) {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.post(`${API_BASE_URL}/vehicles/approve-request`, {
                number: request.number,
                monthly_fee: monthly_fee
            }, { headers });
            return res;
        }
        catch(error: any) {
            console.log(error.message);
            throw new Error(error.message);
        }
    }

    async reject_request(number: string, rejection_reason?: string) {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.post(`${API_BASE_URL}/vehicles/reject-request`, {
                number: number,
                rejection_reason: rejection_reason || 'No reason provided'
            }, { headers });
            return res;
        }
        catch(error: any) {
            console.log(error.message);
            throw new Error(error.message);
        }
    }

    async search_vehicles_with_filter(filter: filterType, page_number: number, page_size: number) {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/vehicles/query-with-filter`, {      
                params: {
                    page_number: page_number,
                    page_size: page_size,
                    filter
                },
                headers
            });
            return res.data.result;
        } 
        catch (err: any) {
            console.log(err.message);
            throw new Error(err.message);
        }
    }

    async query_all_bill(owner: string, page_size: number, page_number: number) {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/bills/query-by-owner`, {      
                params: {
                    page_number,
                    page_size,
                    owner
                },
                headers
            });
            return res.data.result;
        } catch (err: any) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async query_bill_with_filter(filter: any, page_number: number, page_size: number) {
         try {
            const params = {
                page_number,
                page_size,
                filter: typeof filter === 'object' ? JSON.stringify(filter) : filter
            };
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/bills/query-with-filter`, { params, headers });
            return res.data.result;
        } catch (err: any) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async reset_bill(apt_id: string, period = null) {
         try {
            const payload: any = { apt_id };
            if (period) payload.period = period;
            const headers = await getAuthHeaders();
            const res = await axios.patch(`${API_BASE_URL}/bills/reset`, payload, { headers });
            return res.data;
        } catch (err: any) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async update_bill(apt_id: string, bill_value: any) {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.patch(`${API_BASE_URL}/bills/update`, {      
                apt_id,
                bill: bill_value
            }, { headers });
            return res;
        } catch (err: any) {
            console.log(err);
            throw new Error(err.message);
        }
    }

    async get_total_collected() {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_BASE_URL}/bills/query-all-collected`, { headers });
            return res.data.result;
        } catch (err) {
            console.log(err);
        }
    }

    async collect_bill(apt_id: string, total: number, period = null) {
        try {
            const payload: any = { apt_id, total };
            if (period) payload.period = period;
            const headers = await getAuthHeaders();
            const res = await axios.post(`${API_BASE_URL}/bills/collect-bill`, payload, { headers });
            return res;
        } catch (err) {
            console.log(err);
        }
    }
}



