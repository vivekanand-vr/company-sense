import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import { BulkRequest, BulkResponse } from "@/types/company";

// Configure the route for longer execution times
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max duration (can be increased based on your plan)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation - just check for required fields
    if (!body.companies || !Array.isArray(body.companies) || body.companies.length === 0) {
      return NextResponse.json(
        { error: "Companies array is required and must not be empty" },
        { status: 400 }
      );
    }
    
    const requestData: BulkRequest = {
      companies: body.companies,
      filters: body.filters || {}
    };
    
    // Call backend API using axios
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(
      `${backendUrl}/api/companies/bulk-lookup`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 0, // No timeout - wait indefinitely
      }
    );

    // Return the response without validation
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in bulk API:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message || 'Backend API error';
      
      return NextResponse.json(
        { 
          error: 'Backend API error', 
          details: errorMessage,
          statusCode 
        },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}